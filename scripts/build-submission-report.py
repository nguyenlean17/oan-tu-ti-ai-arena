"""Generate the hand-in PDF and measured charts; no browser automation."""
from pathlib import Path
import json
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Image, Flowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from xml.sax.saxutils import escape
root=Path(__file__).resolve().parents[1]
out=root/'docs/submission';evidence=out/'evidence';evidence.mkdir(parents=True,exist_ok=True)
for target,original in [('load-run.json','load-state.json'),('scale-evidence.json','scale-evidence.json')]:
    if not (evidence/target).exists(): (evidence/target).write_bytes((root/'output/operations'/original).read_bytes())
s=json.loads((evidence/'load-run.json').read_text(encoding='utf-8'));scale=json.loads((evidence/'scale-evidence.json').read_text(encoding='utf-8'))
assert s['completed'] and s['accepted']==4000 and s['errors']==0
samples=s['samples'];t=[(p['at']-s['startedAt'])/60000 for p in samples]
plt.rcParams.update({'font.family':'DejaVu Sans','font.size':10,'axes.spines.top':False,'axes.spines.right':False})
fig,axes=plt.subplots(2,2,figsize=(12,7.2),facecolor='#f5f8fb')
for ax,key,title,unit,color in zip(axes.flat,['accepted','queued','rps','p95'],['Accepted HTTP submissions','Official queue backlog','Intake rate per sampling window','p95 latency per sampling window'],['submissions','jobs','requests / second','milliseconds'],['#034ea1','#b06c20','#034ea1','#217453']):
    ax.plot(t,[p[key] for p in samples],color=color,linewidth=1.7);ax.set(title=title,xlabel='Elapsed minutes from run start',ylabel=unit);ax.grid(axis='y',alpha=.18)
    ax.axvline((scale['completedAt']-s['startedAt'])/60000,color='#8c3042',linestyle='--',alpha=.7)
    if key in ('rps','p95'):ax.set_xlim(.45,1.35)
fig.suptitle('UET Arena | Measured HTTP + WASI load run',fontsize=18,fontweight='bold',color='#102b4d')
fig.text(.5,.015,'4,000 submissions | maximum concurrency 64 | pre-created sessions | 2 to 6 workers (dashed line)\nWindow p95 is not a global percentile. No requests after the burst means zero request rate.',ha='center',fontsize=9)
fig.tight_layout(rect=(0,.07,1,.94));fig.savefig(out/'load-overview.png',dpi=160);plt.close(fig)
fonts=Path('C:/Windows/Fonts')
regular=fonts/'arial.ttf' if fonts.exists() else Path('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf')
bold=fonts/'arialbd.ttf' if fonts.exists() else regular.with_name('DejaVuSans-Bold.ttf')
pdfmetrics.registerFont(TTFont('VN',str(regular)));pdfmetrics.registerFont(TTFont('VNB',str(bold)));pdfmetrics.registerFontFamily('VN',normal='VN',bold='VNB',italic='VN',boldItalic='VNB')
styles=getSampleStyleSheet()
for name,size,leading,font,color in [('VN',10.3,16,'VN','#18344d'),('H',21,27,'VNB','#034ea1'),('Sub',12,18,'VNB','#18344d')]:styles.add(ParagraphStyle(name=name,fontName=font,fontSize=size,leading=leading,spaceAfter=11,textColor=colors.HexColor(color)))
class Architecture(Flowable):
    def __init__(self):super().__init__();self.width=500;self.height=158
    def draw(self):
        c=self.canv
        def box(x,y,w,title,detail):
            c.setFillColor(colors.HexColor('#e7eef6'));c.setStrokeColor(colors.HexColor('#d5e0ea'));c.rect(x,y,w,44,fill=1,stroke=1)
            c.setFillColor(colors.HexColor('#034ea1'));c.setFont('VNB',9);c.drawString(x+8,y+27,title);c.setFont('VN',8);c.drawString(x+8,y+11,detail)
        def arrow(x,y,x2,y2):
            c.setStrokeColor(colors.HexColor('#034ea1'));c.line(x,y,x2,y2)
            if x==x2:c.line(x2,y2,x2-3,y2+5);c.line(x2,y2,x2+3,y2+5)
            else:c.line(x2,y2,x2-5,y2-3);c.line(x2,y2,x2-5,y2+3)
        box(0,102,142,'Trình duyệt','Sinh viên / BTC');box(178,102,142,'Caddy / HTTPS','Tên miền của trường');box(356,102,144,'App / API','Auth, giải, queue, replay')
        arrow(142,124,178,124);arrow(320,124,356,124)
        box(0,20,142,'PostgreSQL','Volume SSD, nội bộ');box(178,20,142,'Worker + WASI','Lấy việc qua API nội bộ');box(356,20,144,'Backup ngoài host','NAS / máy độc lập')
        c.line(429,102,429,87);c.line(71,87,429,87);arrow(71,87,71,64)
        c.line(249,64,249,80);c.line(249,80,447,80);c.line(447,80,447,102)
        c.line(71,20,71,9);c.line(71,9,428,9);c.line(428,9,428,20)
story=[]
for chunk in (out/'REPORT.md').read_text(encoding='utf-8').split('\n\n'):
    chunk=chunk.strip()
    if not chunk:continue
    if chunk=='---':story.append(PageBreak());continue
    if chunk=='[LOAD_CHART]':story.append(Image(str(out/'load-overview.png'),width=500,height=300));continue
    if chunk=='[ARCHITECTURE]':story.append(Architecture());continue
    style='H' if chunk.startswith('# ') else 'Sub' if chunk.startswith('## ') else 'VN'
    text=chunk.removeprefix('## ').removeprefix('# ')
    story.append(Paragraph(escape(text).replace('\n','<br/>'),styles[style]))
def footer(c,doc):
    c.setStrokeColor(colors.HexColor('#d5e0ea'));c.line(47,43,548,43);c.setFont('VN',8);c.setFillColor(colors.HexColor('#536b80'));c.drawString(47,29,'UET - VNU | AI Coding Arena | Bản bàn giao 25/10/2026');c.drawRightString(548,29,str(doc.page))
pdf=out/'BAO_CAO_UET_ARENA.pdf'
SimpleDocTemplate(str(pdf),pagesize=(595.28,841.89),leftMargin=47,rightMargin=47,topMargin=47,bottomMargin=58,title='UET Arena - Báo cáo kỹ thuật và triển khai',author='Dự án Lập trình mạng UET').build(story,onFirstPage=footer,onLaterPages=footer)
from pypdf import PdfReader
reader=PdfReader(pdf);text='\n'.join(p.extract_text() for p in reader.pages)
assert len(reader.pages)==8, f'Unexpected overflow: {len(reader.pages)}'
assert all(x in text for x in ['Bảo mật','WASI','PostgreSQL','4.000','SSO'])
print(json.dumps({'pdf':str(pdf),'pages':len(reader.pages)},ensure_ascii=False))
