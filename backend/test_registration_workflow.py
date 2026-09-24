from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_registration_and_auth_workflow():
    print("\n=======================================================")
    print("INSTITUTE: USER REGISTRATION & APPROVAL WORKFLOW TEST")
    print("=======================================================\n")

    # 1. Admin login
    print("Step 1: Admin login...")
    admin_login_res = client.post("/api/auth/login", data={"username": "admin@institute.edu", "password": "Admin@123"})
    assert admin_login_res.status_code == 200, f"Admin login failed: {admin_login_res.text}"
    admin_token = admin_login_res.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print("  [OK] Admin authenticated.\n")

    # 2. Get Department ID
    depts_res = client.get("/api/departments/")
    assert depts_res.status_code == 200
    cse_dept = next(d for d in depts_res.json() if d["short_code"] == "CSE")
    cse_id = cse_dept["id"]

    # 3. New User Registration
    print("Step 2: Public registration of new user Dr. Alok Kumar...")
    reg_data = {
        "full_name": "Dr. Alok Kumar",
        "email": "alok.kumar@institute.edu",
        "password": "Password@123",
        "confirm_password": "Password@123",
        "staff_id": "CSE-FAC-999",
        "phone": "+91-9876543210",
        "department_id": cse_id,
        "designation": "Assistant Professor",
        "role_requested": "DEPARTMENT"
    }
    # Clean up previous test run user if present
    from app.db.session import SessionLocal
    from app.models.user import User
    from app.models.report import Notification
    _db = SessionLocal()
    _existing_u = _db.query(User).filter(User.email == "alok.kumar@institute.edu").first()
    if _existing_u:
        _db.query(Notification).filter(Notification.user_id == _existing_u.id).delete()
        _db.delete(_existing_u)
        _db.commit()
    _db.close()

    reg_res = client.post("/api/auth/register", json=reg_data)
    assert reg_res.status_code == 200, f"Registration failed: {reg_res.text}"
    new_user_id = reg_res.json()["user_id"]
    assert reg_res.json()["status"] == "PENDING"
    print("  [OK] Registered with status PENDING.\n")

    # 4. Attempt login before approval (MUST FAIL)
    print("Step 3: Verify login is blocked while status is PENDING...")
    pending_login_res = client.post("/api/auth/login", data={"username": "alok.kumar@institute.edu", "password": "Password@123"})
    assert pending_login_res.status_code in [400, 403], f"Login should be rejected: {pending_login_res.text}"
    assert "awaiting administrator approval" in pending_login_res.text
    print("  [OK] Login rejected correctly with message: awaiting administrator approval.\n")

    # 5. Admin lists registrations
    print("Step 4: Admin views registrations queue...")
    queue_res = client.get("/api/users/registrations?status=PENDING", headers=admin_headers)
    assert queue_res.status_code == 200
    queue_data = queue_res.json()
    assert queue_data["pending_count"] > 0
    print(f"  [OK] Admin sees {queue_data['pending_count']} pending registrations.\n")

    # 6. Admin approves user
    print(f"Step 5: Admin approves Dr. Alok Kumar (ID: {new_user_id})...")
    approve_res = client.post(f"/api/users/{new_user_id}/approve", headers=admin_headers)
    assert approve_res.status_code == 200, f"Approval failed: {approve_res.text}"
    assert approve_res.json()["status"] == "ACTIVE"
    print("  [OK] User approved! Status is now ACTIVE.\n")

    # 7. Approved User Logs In
    print("Step 6: Approved user logs in...")
    approved_login_res = client.post("/api/auth/login", data={"username": "alok.kumar@institute.edu", "password": "Password@123"})
    assert approved_login_res.status_code == 200, f"Login failed for approved user: {approved_login_res.text}"
    user_token = approved_login_res.json()["access_token"]
    user_headers = {"Authorization": f"Bearer {user_token}"}
    print("  [OK] User logged in successfully! JWT received.\n")

    # 8. User views profile
    print("Step 7: User accesses own profile...")
    prof_res = client.get("/api/users/profile/me", headers=user_headers)
    assert prof_res.status_code == 200
    prof = prof_res.json()
    assert prof["email"] == "alok.kumar@institute.edu"
    assert prof["last_login"] is not None
    print(f"  [OK] Profile retrieved. Last login: {prof['last_login']}\n")

    # 9. User updates allowed profile fields
    print("Step 8: User updates designation & phone...")
    update_res = client.put("/api/users/profile/me", json={"phone": "+91-9123456789", "designation": "Associate Professor"}, headers=user_headers)
    assert update_res.status_code == 200
    assert update_res.json()["phone"] == "+91-9123456789"
    assert update_res.json()["designation"] == "Associate Professor"
    print("  [OK] Allowed profile fields updated.\n")

    # 10. Forgot Password & Reset
    print("Step 9: Test forgot password workflow...")
    forgot_res = client.post("/api/auth/forgot-password", json={"email": "alok.kumar@institute.edu"})
    assert forgot_res.status_code == 200
    dev_token = forgot_res.json().get("dev_reset_token")
    assert dev_token is not None, "Dev reset token should be returned for local development"
    print("  [OK] Reset token generated.\n")

    print("Step 10: Reset password using token...")
    reset_res = client.post("/api/auth/reset-password", json={"token": dev_token, "new_password": "NewSecretPassword@123"})
    assert reset_res.status_code == 200
    print("  [OK] Password reset successful.\n")

    print("Step 11: Login with new password...")
    new_login_res = client.post("/api/auth/login", data={"username": "alok.kumar@institute.edu", "password": "NewSecretPassword@123"})
    assert new_login_res.status_code == 200
    print("  [OK] Logged in with new password.\n")

    # 11. Rejection workflow
    print("Step 12: Test rejection workflow with sample user...")
    sample_res = client.get("/api/users/registrations?status=PENDING", headers=admin_headers)
    pending_users = sample_res.json()["registrations"]
    if pending_users:
        to_reject = pending_users[0]
        reject_res = client.post(f"/api/users/{to_reject['id']}/reject", json={"reason": "Incomplete institutional credentials provided."}, headers=admin_headers)
        assert reject_res.status_code == 200
        assert reject_res.json()["status"] == "REJECTED"
        print(f"  [OK] Rejected registration {to_reject['email']} with reason.")

        # Try to login with rejected user
        rej_login_res = client.post("/api/auth/login", data={"username": to_reject["email"], "password": "Welcome@123"})
        assert rej_login_res.status_code in [400, 403]
        assert "Incomplete institutional credentials" in rej_login_res.text
        print("  [OK] Rejected user login blocked with stored reason.\n")

    # 12. Settings endpoint
    print("Step 13: Test Settings endpoint...")
    settings_res = client.get("/api/settings/")
    assert settings_res.status_code == 200
    settings_data = settings_res.json()
    assert "institute_name" in settings_data
    print(f"  [OK] Settings retrieved: {settings_data['institute_name']}\n")

    # 13. Global Search endpoint
    print("Step 14: Test Global Search endpoint...")
    search_res = client.get("/api/search/?q=Computer", headers=admin_headers)
    assert search_res.status_code == 200
    search_data = search_res.json()
    assert search_data["total_results"] > 0
    print(f"  [OK] Search found {search_data['total_results']} results for 'Computer'.\n")

    print("=======================================================")
    print("ALL REGISTRATION & APPROVAL TESTS PASSED SUCCESSFULLY!")
    print("=======================================================\n")

if __name__ == "__main__":
    test_registration_and_auth_workflow()
