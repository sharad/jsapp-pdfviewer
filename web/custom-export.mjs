function waitForViewer() {
  return new Promise(resolve => {
    const check = () => {
      if (window.PDFViewerApplication &&
          window.PDFViewerApplication.initialized) {
        resolve(window.PDFViewerApplication);
      } else {
        setTimeout(check, 100);
      }
    };
    check();
  });
}

async function init() {
  const PDFViewerApplication = await waitForViewer();

  const eventBus = PDFViewerApplication.eventBus;

  eventBus.on("pagesloaded", () => {
    setupSelection(PDFViewerApplication);
  });
}

function setupSelection(PDFViewerApplication) {

  const thumbnailContainer = document.getElementById("thumbnailView");
  const selectedPages = new Set();

  addExportButton(PDFViewerApplication, selectedPages);

  thumbnailContainer.addEventListener("click", (e) => {

    const thumb = e.target.closest(".thumbnail");
    if (!thumb) return;

    const pageNumber = parseInt(thumb.dataset.pageNumber);

    if (e.ctrlKey) {
      if (selectedPages.has(pageNumber)) {
        selectedPages.delete(pageNumber);
        thumb.style.outline = "";
      } else {
        selectedPages.add(pageNumber);
        thumb.style.outline = "3px solid red";
      }
    }

  });
}

function addExportButton(PDFViewerApplication, selectedPages) {

  if (document.getElementById("exportSelectedBtn")) return;

  const toolbar = document.getElementById("toolbarViewerRight");

  const btn = document.createElement("button");
  btn.id = "exportSelectedBtn";
  btn.textContent = "Export Selected";
  btn.className = "toolbarButton";

  btn.onclick = async () => {

    if (selectedPages.size === 0) {
      alert("No pages selected");
      return;
    }

    const pdfDocument = PDFViewerApplication.pdfDocument;
    const data = await pdfDocument.getData();

    const pdfLibDoc = await PDFLib.PDFDocument.load(data);
    const newPdf = await PDFLib.PDFDocument.create();

    const pages = Array.from(selectedPages)
      .map(p => p - 1)
      .sort((a,b)=>a-b);

    const copied = await newPdf.copyPages(pdfLibDoc, pages);
    copied.forEach(p => newPdf.addPage(p));

    const bytes = await newPdf.save();

    const blob = new Blob([bytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "selected_pages.pdf";
    a.click();

    URL.revokeObjectURL(url);
  };

  toolbar.appendChild(btn);
}

init();

