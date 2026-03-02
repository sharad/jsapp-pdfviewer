import { PDFViewerApplication } from "./viewer.mjs";

async function init() {
  await PDFViewerApplication.initializedPromise;

  const eventBus = PDFViewerApplication.eventBus;

  eventBus.on("pagesloaded", () => {
    setupSelection();
  });
}

function setupSelection() {

  const thumbnailContainer = document.getElementById("thumbnailView");
  const selectedPages = new Set();

  addExportButton(selectedPages);

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

function addExportButton(selectedPages) {

  const toolbar = document.getElementById("toolbarViewerRight");

  if (document.getElementById("exportSelectedBtn")) return;

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

