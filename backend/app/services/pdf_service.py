import io
import os
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas to dynamically compute and print total page count:
    'Page X of Y' alongside running headers and footers.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        if self._pageNumber == 1:
            # Skip header and footer on cover page
            return

        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))

        # Running Header
        self.drawString(54, 11 * inch - 36, "INSTITUTE ANNUAL REPORT")
        self.setStrokeColor(colors.HexColor("#e2e8f0"))
        self.setLineWidth(0.5)
        self.line(54, 11 * inch - 42, 8.5 * inch - 54, 11 * inch - 42)

        # Running Footer
        self.line(54, 46, 8.5 * inch - 54, 46)
        footer_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(8.5 * inch - 54, 32, footer_text)
        self.drawString(54, 32, "Confidential — Official Institutional Document")
        self.restoreState()

def generate_annual_report_pdf(
    academic_year_name: str,
    institute_name: str = "National Institute of Technology & Engineering",
    aggregated_data: dict = None,
    custom_title: str = "ANNUAL PERFORMANCE REPORT"
) -> io.BytesIO:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()
    
    # Custom Palette
    primary_color = colors.HexColor("#1e3a8a") # Deep Navy
    secondary_color = colors.HexColor("#0284c7") # Sky Blue
    dark_text = colors.HexColor("#0f172a") # Slate 900
    light_bg = colors.HexColor("#f8fafc")
    border_color = colors.HexColor("#cbd5e1")

    # Typography Styles
    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=26,
        leading=32,
        textColor=primary_color,
        alignment=1 # Center
    )

    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=14,
        leading=18,
        textColor=secondary_color,
        alignment=1
    )

    h1_style = ParagraphStyle(
        'H1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=primary_color,
        spaceBefore=12,
        spaceAfter=8
    )

    h2_style = ParagraphStyle(
        'H2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=secondary_color,
        spaceBefore=10,
        spaceAfter=6
    )

    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13,
        textColor=dark_text
    )

    table_header_style = ParagraphStyle(
        'TH',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=11,
        textColor=colors.white,
        alignment=0
    )

    table_cell_style = ParagraphStyle(
        'TD',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        textColor=dark_text
    )

    story = []

    # ==========================
    # 1. COVER PAGE
    # ==========================
    story.append(Spacer(1, 1.5 * inch))
    story.append(Paragraph(institute_name.upper(), subtitle_style))
    story.append(Spacer(1, 0.25 * inch))
    story.append(Paragraph(custom_title, title_style))
    story.append(Spacer(1, 0.15 * inch))
    story.append(Paragraph(f"ACADEMIC YEAR: {academic_year_name}", subtitle_style))
    story.append(Spacer(1, 0.3 * inch))

    story.append(HRFlowable(width="60%", thickness=2, color=secondary_color, spaceBefore=10, spaceAfter=20))

    story.append(Spacer(1, 1.5 * inch))
    meta_text = f"""
    <b>Approved Annual Compilation</b><br/><br/>
    <b>Date of Publication:</b> {datetime.now().strftime('%B %d, %Y')}<br/>
    <b>Status:</b> Official Institute Record<br/>
    <b>Portal:</b> Institute Annual Report Portal
    """
    story.append(Paragraph(meta_text, ParagraphStyle('Meta', parent=body_style, alignment=1, leading=16)))

    story.append(PageBreak())

    # ==========================
    # 2. TABLE OF CONTENTS / EXECUTIVE SUMMARY
    # ==========================
    story.append(Paragraph("Executive Institutional Summary", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=primary_color, spaceBefore=4, spaceAfter=14))

    totals = aggregated_data.get("institute_totals", {}) if aggregated_data else {}

    summary_data = [
        [Paragraph("Metric", table_header_style), Paragraph("Institute Consolidated Total", table_header_style)],
        [Paragraph("Approved Departments Included", table_cell_style), Paragraph(str(aggregated_data.get("approved_departments_count", 0)), table_cell_style)],
        [Paragraph("Total Full-Time Faculty", table_cell_style), Paragraph(str(totals.get("total_faculty", 0)), table_cell_style)],
        [Paragraph("Total Enrolled Students", table_cell_style), Paragraph(str(totals.get("total_students", 0)), table_cell_style)],
        [Paragraph("Undergraduate (UG) Students", table_cell_style), Paragraph(str(totals.get("ug_students", 0)), table_cell_style)],
        [Paragraph("Postgraduate (PG) Students", table_cell_style), Paragraph(str(totals.get("pg_students", 0)), table_cell_style)],
        [Paragraph("Graduating Students", table_cell_style), Paragraph(str(totals.get("graduating_students", 0)), table_cell_style)],
        [Paragraph("Research Publications (Journals/Patents)", table_cell_style), Paragraph(str(totals.get("total_publications", 0)), table_cell_style)],
        [Paragraph("Student & Faculty Projects", table_cell_style), Paragraph(str(totals.get("total_projects", 0)), table_cell_style)],
        [Paragraph("Events, Workshops & Conferences", table_cell_style), Paragraph(str(totals.get("total_events", 0)), table_cell_style)],
        [Paragraph("Institutional Achievements & Awards", table_cell_style), Paragraph(str(totals.get("total_achievements", 0)), table_cell_style)],
        [Paragraph("Placement Offers Secured", table_cell_style), Paragraph(str(totals.get("total_placed", 0)), table_cell_style)],
        [Paragraph("Overall Placement Rate", table_cell_style), Paragraph(f"{totals.get('placement_rate', 0)}%", table_cell_style)],
        [Paragraph("Highest Compensation Package", table_cell_style), Paragraph(f"Rs. {totals.get('highest_package', 0)} LPA", table_cell_style)],
        [Paragraph("Average Compensation Package", table_cell_style), Paragraph(f"Rs. {totals.get('average_package', 0)} LPA", table_cell_style)],
    ]

    summary_table = Table(summary_data, colWidths=[3.2 * inch, 3.8 * inch])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), primary_color),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('GRID', (0, 0), (-1, -1), 0.5, border_color),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, light_bg]),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 0.25 * inch))

    # ==========================
    # 3. DEPARTMENT-WISE BREAKDOWN
    # ==========================
    departments = aggregated_data.get("departments", []) if aggregated_data else []

    for dept in departments:
        story.append(PageBreak())
        dept_name = dept.get("department_name", "Department")
        dept_code = dept.get("department_code", "")
        hod = dept.get("head_of_department", "N/A")
        
        story.append(Paragraph(f"Department of {dept_name} ({dept_code})", h1_style))
        story.append(Paragraph(f"Head of Department: {hod} | Status: Approved for Annual Publication", subtitle_style))
        story.append(HRFlowable(width="100%", thickness=1, color=primary_color, spaceBefore=4, spaceAfter=10))

        # Overview
        info = dept.get("department_info") or {}
        overview = info.get("overview") or f"The Department of {dept_name} is committed to academic excellence, innovative research, and professional student development."
        story.append(Paragraph(f"<b>Overview:</b> {overview}", body_style))
        story.append(Spacer(1, 0.15 * inch))

        # Key Statistics Table for this Department
        story.append(Paragraph("Department Overview & Placement Summary", h2_style))
        p = dept.get("placement") or {}
        st = dept.get("student_statistics") or {}

        dept_summary_data = [
            [Paragraph("Faculty Count", table_cell_style), Paragraph(str(len(dept.get("faculty", []))), table_cell_style),
             Paragraph("Total Students", table_cell_style), Paragraph(str(st.get("total_students", 0)), table_cell_style)],
            [Paragraph("Publications", table_cell_style), Paragraph(str(len(dept.get("research", []))), table_cell_style),
             Paragraph("Projects", table_cell_style), Paragraph(str(len(dept.get("projects", []))), table_cell_style)],
            [Paragraph("Students Placed", table_cell_style), Paragraph(f"{p.get('placed_students', 0)} / {p.get('eligible_students', 0)}", table_cell_style),
             Paragraph("Highest Package", table_cell_style), Paragraph(f"{p.get('highest_package', 0)} LPA", table_cell_style)],
        ]
        dept_summary_tbl = Table(dept_summary_data, colWidths=[1.8 * inch, 1.7 * inch, 1.8 * inch, 1.7 * inch])
        dept_summary_tbl.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), light_bg),
            ('GRID', (0, 0), (-1, -1), 0.5, border_color),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        story.append(dept_summary_tbl)
        story.append(Spacer(1, 0.15 * inch))

        # Faculty Table
        faculty_list = dept.get("faculty", [])
        if faculty_list:
            story.append(Paragraph("Faculty Members", h2_style))
            fac_headers = [Paragraph("Name", table_header_style), Paragraph("Designation", table_header_style), Paragraph("Qualification", table_header_style), Paragraph("Specialization", table_header_style)]
            fac_rows = [fac_headers]
            for f in faculty_list:
                fac_rows.append([
                    Paragraph(f.get("name", ""), table_cell_style),
                    Paragraph(f.get("designation", ""), table_cell_style),
                    Paragraph(f.get("qualification", ""), table_cell_style),
                    Paragraph(f.get("specialization", ""), table_cell_style),
                ])
            fac_tbl = Table(fac_rows, colWidths=[2.2 * inch, 1.6 * inch, 1.6 * inch, 1.6 * inch])
            fac_tbl.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), primary_color),
                ('GRID', (0, 0), (-1, -1), 0.5, border_color),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, light_bg]),
                ('TOPPADDING', (0, 0), (-1, -1), 3),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ]))
            story.append(fac_tbl)
            story.append(Spacer(1, 0.15 * inch))

        # Research / Publications
        research_list = dept.get("research", [])
        if research_list:
            story.append(Paragraph("Research Publications", h2_style))
            res_headers = [Paragraph("Title", table_header_style), Paragraph("Authors", table_header_style), Paragraph("Type", table_header_style), Paragraph("Year", table_header_style)]
            res_rows = [res_headers]
            for r in research_list:
                res_rows.append([
                    Paragraph(r.get("title", ""), table_cell_style),
                    Paragraph(r.get("authors", ""), table_cell_style),
                    Paragraph(r.get("publication_type", ""), table_cell_style),
                    Paragraph(str(r.get("year", "")), table_cell_style),
                ])
            res_tbl = Table(res_rows, colWidths=[3.2 * inch, 2.0 * inch, 1.0 * inch, 0.8 * inch])
            res_tbl.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), primary_color),
                ('GRID', (0, 0), (-1, -1), 0.5, border_color),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, light_bg]),
                ('TOPPADDING', (0, 0), (-1, -1), 3),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ]))
            story.append(res_tbl)
            story.append(Spacer(1, 0.15 * inch))

        # Events & Achievements
        events_list = dept.get("events", [])
        if events_list:
            story.append(Paragraph("Organized Events & Conferences", h2_style))
            ev_headers = [Paragraph("Event Name", table_header_style), Paragraph("Type", table_header_style), Paragraph("Participants", table_header_style), Paragraph("Venue", table_header_style)]
            ev_rows = [ev_headers]
            for e in events_list:
                ev_rows.append([
                    Paragraph(e.get("event_name", ""), table_cell_style),
                    Paragraph(e.get("event_type", ""), table_cell_style),
                    Paragraph(str(e.get("participants_count", 0)), table_cell_style),
                    Paragraph(e.get("venue", "Campus"), table_cell_style),
                ])
            ev_tbl = Table(ev_rows, colWidths=[3.0 * inch, 1.5 * inch, 1.1 * inch, 1.4 * inch])
            ev_tbl.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), primary_color),
                ('GRID', (0, 0), (-1, -1), 0.5, border_color),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, light_bg]),
                ('TOPPADDING', (0, 0), (-1, -1), 3),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ]))
            story.append(ev_tbl)

    doc.build(story, canvasmaker=NumberedCanvas)
    buffer.seek(0)
    return buffer
