// PLGen Connector — M2 prototype.
// Reads the active Doc's revision history, sends a summary to the registry's
// scoring endpoint, and renders the resulting paste/session signal as a
// plain-language summary in the sidebar. Not linked to a real pl_id or
// registration yet — see sessions/2026-07-13-gemini-gem-google-ecosystem.md
// and sessions/2026-07-14-m2-heuristic-and-strategy-reset.md for context.

var REGISTRY_URL = 'https://registry.provenancelabel.org/api/labels/score';
var MAX_REVISIONS_TO_SIZE = 15;

// Simple trigger — must stay UI-only. Runs before the user has granted
// scopes, so anything touching Drive/UrlFetchApp belongs in testPlgenConnection().
function onOpen(e) {
  DocumentApp.getUi()
    .createAddonMenu()
    .addItem('Check Writing Pattern', 'showSidebar')
    .addToUi();
}

function onInstall(e) {
  onOpen(e);
}

function showSidebar() {
  var output = HtmlService.createHtmlOutputFromFile('Sidebar')
    .setTitle('PLGen Writing Pattern Check');
  DocumentApp.getUi().showSidebar(output);
}

// Called from the sidebar button via google.script.run. Every failure mode
// (auth, Drive API, network, non-2xx) is caught and returned as a plain
// object rather than thrown, since the sidebar needs a result either way —
// never a rejected promise — to render something useful.
function testPlgenConnection() {
  try {
    var docId = DocumentApp.getActiveDocument().getId();
    var summary = buildRevisionSummary(docId);
    var result = postToRegistry(summary);

    var parsed = null;
    try {
      parsed = JSON.parse(result.body);
    } catch (parseErr) {
      parsed = null; // registry returned non-JSON (e.g. an error page) — leave rawResponse for debugging
    }

    return {
      ok: true,
      docId: docId,
      revisionCount: summary.revision_count,
      httpStatus: result.status,
      pasteSignal: (parsed && parsed.paste_signal) || null,
      rawPayload: summary,
      rawResponse: result.body
    };
  } catch (err) {
    return {
      ok: false,
      message: err.message,
      stack: err.stack || ''
    };
  }
}

function buildRevisionSummary(docId) {
  var page = Drive.Revisions.list(docId, {
    fields: 'revisions(id,modifiedTime,lastModifyingUser,exportLinks),nextPageToken',
    pageSize: 25
  });
  var revisions = page.revisions || [];

  var token = ScriptApp.getOAuthToken();
  var sized = 0;

  var summarized = revisions.map(function (rev) {
    var entry = {
      id: rev.id,
      modified_time: rev.modifiedTime,
      size_chars: null
    };

    var exportUrl = rev.exportLinks && rev.exportLinks['text/plain'];
    if (exportUrl && sized < MAX_REVISIONS_TO_SIZE) {
      entry.size_chars = fetchRevisionTextSize(exportUrl, token);
      sized++;
    }

    return entry;
  });

  return {
    doc_id: docId,
    revision_count: summarized.length,
    revisions: summarized
  };
}

// Native Google Docs don't populate Revision.size (that field only applies
// to binary files). Each revision's exportLinks map (Drive API v3 Revision
// resource) gives a plain-text export URL for that specific revision instead
// — we use its content length as a rough size proxy.
function fetchRevisionTextSize(exportUrl, token) {
  var resp = UrlFetchApp.fetch(exportUrl, {
    headers: { Authorization: 'Bearer ' + token },
    muteHttpExceptions: true
  });

  return resp.getResponseCode() === 200 ? resp.getContentText().length : null;
}

function postToRegistry(summary) {
  var resp = UrlFetchApp.fetch(REGISTRY_URL, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(summary),
    muteHttpExceptions: true
  });

  return {
    status: resp.getResponseCode(),
    body: resp.getContentText()
  };
}
