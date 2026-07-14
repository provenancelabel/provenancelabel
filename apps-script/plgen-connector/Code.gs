// PLGen Connector — M1 connectivity spike.
// Reads the active Doc's revision history and round-trips a summary to the
// registry's stub scoring endpoint. No paste-detection logic yet — see
// sessions/2026-07-13-gemini-gem-google-ecosystem.md for the full context.

var REGISTRY_URL = 'https://registry.provenancelabel.org/api/labels/score';
var MAX_REVISIONS_TO_SIZE = 15;

// Simple trigger — must stay UI-only. Runs before the user has granted
// scopes, so anything touching Drive/UrlFetchApp belongs in testPlgenConnection().
function onOpen(e) {
  DocumentApp.getUi()
    .createAddonMenu()
    .addItem('Test PLGen Connection', 'showSidebar')
    .addToUi();
}

function onInstall(e) {
  onOpen(e);
}

function showSidebar() {
  var output = HtmlService.createHtmlOutputFromFile('Sidebar')
    .setTitle('PLGen Connection Test');
  DocumentApp.getUi().showSidebar(output);
}

// Called from the sidebar button via google.script.run. Every failure mode
// (auth, Drive API, network, non-2xx) is caught and returned as a string
// rather than thrown, since this is a diagnostic tool.
function testPlgenConnection() {
  try {
    var docId = DocumentApp.getActiveDocument().getId();
    var summary = buildRevisionSummary(docId);
    var result = postToRegistry(summary);

    return 'Doc ID: ' + docId + '\n' +
      'Revisions found: ' + summary.revision_count + '\n\n' +
      '--- Payload sent ---\n' + JSON.stringify(summary, null, 2) + '\n\n' +
      '--- Registry response ---\n' +
      'HTTP ' + result.status + '\n' + result.body;
  } catch (err) {
    return 'ERROR: ' + err.message + '\n\n' + (err.stack || '');
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
