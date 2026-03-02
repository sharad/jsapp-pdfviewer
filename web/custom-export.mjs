console.log("CUSTOM EXPORT FILE LOADED");

function waitForApp() {
  return new Promise(resolve => {
    const check = () => {
      if (window.PDFViewerApplication &&
          window.PDFViewerApplication.pdfThumbnailViewer &&
          window.PDFViewerApplication.pdfDocument) {
        resolve(window.PDFViewerApplication);
      } else {
        setTimeout(check, 100);
      }
    };
    check();
  });
}

async function init() {

  const app = await waitForApp();
  console.log("PDFViewerApplication ready");

  const selectedPages = new Set();

  addExportButton(app, selectedPages);

  attachThumbnailLogic(app, selectedPages);
}



function attachThumbnailLogic(app, selectedPages) {

  const thumbnails = app.pdfThumbnailViewer._thumbnails;

  thumbnails.forEach(thumbnail => {

    const div = thumbnail.div;

    div.addEventListener("click", (e) => {

      const pageNumber = thumbnail.id;

      if (e.ctrlKey) {
        // multi select
        if (selectedPages.has(pageNumber)) {
          selectedPages.delete(pageNumber);
        } else {
          selectedPages.add(pageNumber);
        }
      } else {
        // normal click → behave like PDF.js default
        selectedPages.clear();
        selectedPages.add(pageNumber);
      }

      refreshVisualSelection(app, selectedPages);
      updateCounter(selectedPages);
    });

  });

  // IMPORTANT: reapply selection whenever thumbnails re-render
  app.eventBus.on("pagerendered", () => {
    refreshVisualSelection(app, selectedPages);
  });

  console.log("Thumbnail logic attached");
}


function updateCounter(selectedPages) {
  let counter = document.getElementById("selectionCounter");
  if (!counter) {
    counter = document.createElement("span");
    counter.id = "selectionCounter";
    counter.style.marginLeft = "10px";
    document.getElementById("toolbarViewerRight").appendChild(counter);
  }
  counter.textContent = `${selectedPages.size} selected`;
}

function refreshVisualSelection(app, selectedPages) {

  app.pdfThumbnailViewer._thumbnails.forEach(thumbnail => {

    const ring = thumbnail.div.querySelector(".thumbnailSelectionRing");
    if (!ring) return;

    if (selectedPages.has(thumbnail.id)) {
      ring.classList.add("customSelected");
    } else {
      ring.classList.remove("customSelected");
    }

  });
}


function toggle(div, pageNumber, selectedPages) {

  if (selectedPages.has(pageNumber)) {
    selectedPages.delete(pageNumber);
    div.classList.remove("customSelected");
  } else {
    selectedPages.add(pageNumber);
    div.classList.add("customSelected");
  }
}

function clearAll(app, selectedPages) {

  selectedPages.clear();

  app.pdfThumbnailViewer._thumbnails.forEach(thumbnail => {
    thumbnail.div.classList.remove("customSelected");
  });
}

function addExportButton(app, selectedPages) {

  if (document.getElementById("exportSelectedBtn")) return;

  const toolbar = document.getElementById("toolbarViewerRight");
  if (!toolbar) return;

  const btn = document.createElement("button");
  btn.id = "exportSelectedBtn";
  btn.textContent = "Export Selected";
  btn.className = "toolbarButton";

  btn.onclick = async () => {

    if (selectedPages.size === 0) {
      alert("No pages selected");
      return;
    }

    const data = await app.pdfDocument.getData();

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


