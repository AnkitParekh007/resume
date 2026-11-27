#!/usr/bin/env python3
"""Generate the approved forward-deployed-engineering resume downloads for GitHub Pages."""
import os
from pathlib import Path
from xml.sax.saxutils import escape
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, KeepTogether, PageBreak

ROOT = Path(__file__).resolve().parent.parent
FONT_DIRS = [Path(d) for d in filter(None, [
    os.environ.get('RESUME_FONT_DIR'),
    '/usr/share/fonts/truetype/dejavu',
    '/Library/Fonts',
    str(Path.home() / 'Library/Fonts'),
])]
NAME = "ANKIT PAREKH"
HEADLINE = "FRONTEND ARCHITECT | PRINCIPAL FORWARD DEPLOYED ENGINEER | ENTERPRISE AI"
CONTACT = [
    "Mumbai, India  |  +91 99203 53532  |  ankit77parekh@gmail.com",
    "LinkedIn: linkedin.com/in/akkiparekh  |  GitHub: github.com/AnkitParekh007",
    "Portfolio: ankit-parekh.org",
]
SECTIONS = [
("PROFESSIONAL SUMMARY", [
("body", "Principal Forward-Deployed Engineer and Frontend Architect delivering enterprise software since 2012. I get AI from a working demo into a business that has to live with it. At Bluemeteor I run a seven-person team and personally own the architecture, integrations and production accountability across three products, reporting weekly to a finance-led board. I work directly with customers from pain-point discovery through implementation, demonstrations, feedback and production support. I build with AI coding agents under a three-gate review and evaluation process, which is how a small team ships integrations with Stripe, Firebase and twelve LLM providers. Architected and delivered the AI multi-agent assistant, now live with 11 customer organizations.")
]),
("CORE CAPABILITIES", [
("body", "Customer-facing AI delivery: Customer discovery, requirements translation, demos, iterative feedback, customer troubleshooting, supplier onboarding workflows"),
("body", "AI & agentic systems: LLMs, RAG, MCP, tool calling, LLM routing, governed agents, human-in-the-loop approvals, evaluations, auditability"),
("body", "Frontend & architecture: Angular, TypeScript, React (5+ years), Vue.js, RxJS, Angular Material, AG Grid Enterprise, design systems, performance"),
("body", "Backend & delivery: Node.js, NestJS, Next.js, REST APIs, Supabase, PostgreSQL/pgvector, CI/CD, Playwright, AWS, Docker")
]),
("PROFESSIONAL EXPERIENCE", [
("role", "Bluemeteor (formerly Codifyd)  |  Principal Forward-Deployed Engineer"),
("meta", "Frontend Architect | Enterprise AI Architect"),
("meta", "Sep 2022 - Oct 2026  |  Remote  |  US-based enterprise product-content platform (PIM/PXM/DAM)"),
("bullet", "Worked directly with enterprise customers to discover onboarding bottlenecks, demonstrate the AI workflows, gather feedback, deliver improvements and troubleshoot customer-specific issues."),
("bullet", "Architected and delivered the AI multi-agent assistant end to end, from the Angular client to the NestJS service. It answers with citations and runs multi-step workflows only after the user approves; now live with 11 customer organizations."),
("bullet", "Chose a plan-first design: a deterministic action catalog, separate read and write risk classes, re-planning on failure, an audit ledger per run, and hybrid retrieval."),
("bullet", "Built evaluation harnesses and release gates for controlled production deployment."),
("bullet", "Personally designed and implemented AI-assisted supplier product mapping and missing-SKU-attribute suggestions aligned with distributor-defined validation rules."),
("bullet", "Owned AG Grid Enterprise data screens and multi-environment CDN release pipelines."),
("bullet", "Removed a multi-minute UI freeze by reducing approximately 551 lookup operations to 40 for visible rows (92.7% fewer lookup operations)."),
("role", "Forto GmbH  |  Senior Frontend Architect"),
("meta", "Sep 2021 - Sep 2022  |  Berlin, Germany  |  Digital freight forwarding"),
("bullet", "Led frontend architecture for a production Next.js application, working across React, TypeScript, and API integration."),
("bullet", "Drove TypeScript adoption across the codebase, introducing strict types and shared interfaces at component and API boundaries; with most of the codebase typed, developer experience and AI coding-agent output improved by an estimated 50%+."),
("bullet", "Worked with client stakeholders to translate product requirements into application flows, then delivered user-facing features from requirements through release."),
("bullet", "Simplified component and interaction patterns while shipping features, so the shared frontend was easier for the team to keep building on.")
]),
("PROFESSIONAL EXPERIENCE (CONTINUED)", [
("role", "Codifyd  |  Team Lead"),
("meta", "2018 - 2021  |  Mumbai, India  |  Product information management"),
("bullet", "Led 5 developers and owned frontend architecture across three enterprise applications: the retailer PIM, the supplier portal and BridgeWeb."),
("bullet", "Defined module boundaries for large, multi-module Angular apps."),
("bullet", "Owned technical direction: stack fit, integration contracts and delivery trade-offs."),
("bullet", "Drove reusable UI patterns and consistency across three products."),
("bullet", "Ran release coordination with DevOps and platform teams on CI/CD and build tooling."),
("role", "Verdantis  |  Senior Frontend Engineer"),
("meta", "2012 - 2016"),
("bullet", "Built data-dense enterprise forms, tables and workflows with strict validation and state handling."),
("bullet", "Engineered the platform infrastructure behind an NX monorepo serving 5 brands across 12 locales: multi-locale and brand API configuration, CSRF protection, a GraphQL proxy keeping service credentials server-side, and React Query SSR with HydrationBoundary. These were shared foundations consumed by every delivery pod."),
("bullet", "Re-engineered the local-development and release layer so the shared core repository and the per-partner repositories run from a single folder structure under Vite, then rebuilt the CI/CD pipeline to drive both from one place. Deploying a partner repo now triggers the core pipeline automatically, removing manual release sequencing."),
("bullet", "Designed a bidirectional middleware between the React interaction layer and the Three.js engine: a property change in React, such as object height, invokes the 3D engine to update the 3D/2D canvas in real time, and engine-side changes propagate back to the UI.")
]),
("SELECTED OPEN-SOURCE PROJECTS", [
("role", "ReboundOps  |  Local-first Career & Job-search Platform"),
("meta", "Angular, TypeScript, Node.js, Playwright  |  github.com/AnkitParekh007/rebound-ops"),
("bullet", "Created an open-source local-first platform for role evaluation, application preparation, tracking and privacy-conscious AI-assisted workflows."),
("role", "ngx-copilot-platform  |  Enterprise Angular AI Copilot SDK"),
("meta", "Angular, TypeScript, Next.js, RAG, Supabase pgvector  |  github.com/AnkitParekh007/ngx-copilot-platform"),
("bullet", "Built a reusable Angular Copilot SDK with streaming events, retrieval-backed citations, tool-execution visibility and human approval interfaces."),
("role", "org-ai-force  |  Enterprise AI Agent Workspace Prototype"),
("meta", "Angular, NestJS, MCP, RAG, RBAC, Playwright  |  github.com/AnkitParekh007/org-ai-force"),
("bullet", "Prototyped an enterprise agent workspace with authorization boundaries, governed tool workflows, admin controls and failure-recovery scenarios.")
]),
("EDUCATION", [
("body", "Bachelor of Engineering (B.E.), Computer Science  |  Atharva College of Engineering, University of Mumbai  |  2013")
]),
("SELECTED AI TRAINING & CREDENTIALS", [
("body", "LangChain Academy: LangGraph Essentials (TypeScript), Building Reliable Agents with LangSmith, Agent Observability & Evaluations."),
("body", "Claude Academy: Model Context Protocol, Tool Use with the Messages API, Introduction to Evals."),
("body", "OpenAI Academy: Design and Build Agentic Systems, Evaluate AI Applications, Build with Retrieval-Augmented Generation."),
("body", "Full course and credential list: ankit-parekh.org")
]),
]

def word_resume():
    doc=Document()
    sec=doc.sections[0]
    sec.top_margin=Inches(.60);sec.bottom_margin=Inches(.58)
    sec.left_margin=Inches(.72);sec.right_margin=Inches(.72)
    styles=doc.styles
    normal=styles['Normal']
    normal.font.name='Calibri';normal.font.size=Pt(9)
    normal.paragraph_format.space_after=Pt(2)
    for n,pt,color,bold in [('Name',17,(18,24,47),True),('Head',9,(37,62,114),True),('Section',10,(37,62,114),True),('Role',9.2,(18,24,47),True),('Meta',8,(70,84,108),False)]:
        st=styles.add_style('FDE'+n,1)
        st.font.name='Calibri';st.font.size=Pt(pt);st.font.bold=bold;st.font.color.rgb=RGBColor(*color)
        st.paragraph_format.space_before=Pt(5 if n in ('Section','Role') else 0)
        st.paragraph_format.space_after=Pt(2)
    p=doc.add_paragraph(NAME,'FDEName');p.alignment=WD_ALIGN_PARAGRAPH.CENTER
    p=doc.add_paragraph(HEADLINE,'FDEHead');p.alignment=WD_ALIGN_PARAGRAPH.CENTER
    for line in CONTACT:
        p=doc.add_paragraph(line);p.alignment=WD_ALIGN_PARAGRAPH.CENTER
    for heading, rows in SECTIONS:
        if heading=='PROFESSIONAL EXPERIENCE (CONTINUED)':
            doc.add_page_break()
        doc.add_paragraph(heading,'FDESection')
        for kind,value in rows:
            style={'role':'FDERole','meta':'FDEMeta','body':'Normal','bullet':'Normal'}[kind]
            p=doc.add_paragraph(value,style)
            if kind=='bullet':
                p.style='List Bullet'
                p.paragraph_format.left_indent=Inches(.17)
                p.paragraph_format.first_line_indent=Inches(-.12)
                p.paragraph_format.space_after=Pt(1)
    doc.save(ROOT/'AnkitParekh_Resume.docx')

def pdf_resume():
    font_dir = next((d for d in FONT_DIRS if (d / 'DejaVuSans.ttf').exists()), None)
    if font_dir is None:
        raise SystemExit('DejaVu Sans fonts not found. Set RESUME_FONT_DIR to a folder containing DejaVuSans.ttf, DejaVuSans-Bold.ttf and DejaVuSans-Oblique.ttf.')
    pdfmetrics.registerFont(TTFont('FDE-Regular', str(font_dir / 'DejaVuSans.ttf')))
    pdfmetrics.registerFont(TTFont('FDE-Bold', str(font_dir / 'DejaVuSans-Bold.ttf')))
    pdfmetrics.registerFont(TTFont('FDE-Oblique', str(font_dir / 'DejaVuSans-Oblique.ttf')))
    st=getSampleStyleSheet()
    st.add(ParagraphStyle(name='FName',fontName='FDE-Bold',fontSize=17,leading=20,textColor=colors.HexColor('#12182f'),alignment=TA_CENTER,spaceAfter=3))
    st.add(ParagraphStyle(name='FHead',fontName='FDE-Bold',fontSize=9,leading=12,textColor=colors.HexColor('#253e72'),alignment=TA_CENTER,spaceAfter=4))
    st.add(ParagraphStyle(name='FContact',fontName='FDE-Regular',fontSize=8,leading=10,alignment=TA_CENTER,spaceAfter=1))
    st.add(ParagraphStyle(name='FSection',fontName='FDE-Bold',fontSize=10,leading=13,textColor=colors.HexColor('#253e72'),spaceBefore=10,spaceAfter=4,keepWithNext=True))
    st.add(ParagraphStyle(name='FRole',fontName='FDE-Bold',fontSize=9.1,leading=12,spaceBefore=5,spaceAfter=2,keepWithNext=True))
    st.add(ParagraphStyle(name='FMeta',fontName='FDE-Oblique',fontSize=8,leading=11,textColor=colors.HexColor('#46546c'),spaceAfter=2,keepWithNext=True))
    st.add(ParagraphStyle(name='FBody',fontName='FDE-Regular',fontSize=8.6,leading=11.5,spaceAfter=3))
    st.add(ParagraphStyle(name='FBullet',parent=st['FBody'],leftIndent=12,firstLineIndent=-8,spaceAfter=2))
    flow=[Paragraph(NAME,st['FName']),Paragraph(HEADLINE,st['FHead'])]
    flow.extend(Paragraph(escape(line),st['FContact']) for line in CONTACT)
    for heading,rows in SECTIONS:
        if heading=='PROFESSIONAL EXPERIENCE (CONTINUED)':
            flow.append(PageBreak())
        flow.append(Paragraph(escape(heading),st['FSection']))
        for kind,value in rows:
            key={'role':'FRole','meta':'FMeta','body':'FBody','bullet':'FBullet'}[kind]
            text=('&#8226; ' if kind=='bullet' else '')+escape(value)
            flow.append(Paragraph(text,st[key]))
    pdf=SimpleDocTemplate(str(ROOT/'AnkitParekh_Resume.pdf'),pagesize=A4,
        leftMargin=46,rightMargin=46,topMargin=41,bottomMargin=41,
        title='Ankit Parekh - Frontend Architect and Principal Forward Deployed Engineer')
    pdf.build(flow)

if __name__=='__main__':
    word_resume()
    pdf_resume()
    for ext in ('pdf','docx'):
        p=ROOT/('AnkitParekh_Resume.'+ext)
        assert p.stat().st_size>1000,p
        print(p.name,p.stat().st_size)
