// PLGen Connector — M2 prototype.
// Reads the active Doc's revision history, sends a summary to the registry's
// scoring endpoint, and renders the resulting paste/session signal as a
// plain-language summary in the sidebar. Can also issue a real free-tier PL
// label via the registry's /register endpoint and insert it into the doc.
// The paste/session signal above is NOT yet fed into that registration (see
// registry#4) — issuing a label today is plain self-report only, same as
// the site's /new form. See sessions/2026-07-13-gemini-gem-google-ecosystem.md,
// 2026-07-14-m2-heuristic-and-strategy-reset.md, and 2026-08-18-addon-handoff-
// plan-and-readable-sidebar.md for context.

var REGISTRY_URL = 'https://registry.provenancelabel.org/api/labels/score';
var REGISTER_URL = 'https://registry.provenancelabel.org/api/labels/register';
var MAX_REVISIONS_TO_SIZE = 15;

// Deliberately free tier only — this Add-on issues labels on behalf of
// whoever's running it (e.g. a pilot professor testing on their own doc),
// never the developer's own member account. No x-plgen-key is ever sent.
// Revisit if/when there's a real per-installation member auth story.

// Marks the paragraph range in the doc that holds the currently-applied
// label, so re-issuing replaces it instead of stacking duplicates.
var LABEL_START_MARKER = '⟦PLGEN-LABEL-START⟧';
var LABEL_END_MARKER   = '⟦PLGEN-LABEL-END⟧';

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

// Called from the sidebar's "Issue Label" button. Registers a real free-tier
// PL label via the registry's self-report endpoint — does NOT touch the
// document. The sidebar holds onto the returned object and passes it back
// to applyLabelToDocument() if the user chooses to insert it.
function issueLabel(fields) {
  try {
    var validationError = validateLabelFields(fields);
    if (validationError) return { ok: false, message: validationError };

    var payload = {
      author: fields.author,
      human_pct: parseInt(fields.human, 10),
      ai_pct: parseInt(fields.ai, 10)
    };
    if (fields.tools) payload.ai_tools = fields.tools;
    if (fields.notes) payload.process_notes = fields.notes;

    var resp = UrlFetchApp.fetch(REGISTER_URL, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    var status = resp.getResponseCode();
    var parsed = null;
    try {
      parsed = JSON.parse(resp.getContentText());
    } catch (parseErr) {
      parsed = null;
    }

    if (status !== 200 || !parsed || !parsed.pl_id) {
      return {
        ok: false,
        message: 'Registration failed (HTTP ' + status + ').',
        rawResponse: resp.getContentText()
      };
    }

    return {
      ok: true,
      plId: parsed.pl_id,
      tier: parsed.tier,
      url: parsed.url || null,
      labelText: parsed.label_text || null,
      upgradeCta: parsed.upgrade_cta || null,
      createdAt: parsed.created_at
    };
  } catch (err) {
    return { ok: false, message: err.message, stack: err.stack || '' };
  }
}

// Called from the sidebar's "Apply Label to Document" button, passed the
// object issueLabel() returned. Inserts (or replaces) a marked block at the
// top of the doc. Re-issuing and re-applying replaces the old block rather
// than stacking a new one, so the doc's own (native) revision history shows
// the latest PL in its latest revision without any custom timestamp logic.
function applyLabelToDocument(issuedLabel) {
  try {
    if (!issuedLabel || !issuedLabel.ok || !issuedLabel.plId) {
      return { ok: false, message: 'No issued label to apply — issue one first.' };
    }

    var body = DocumentApp.getActiveDocument().getBody();
    removeExistingLabelBlock(body);

    var lines = [LABEL_START_MARKER];
    if (issuedLabel.tier === 'registered') {
      lines.push('Provenance Label: ' + issuedLabel.plId);
      lines.push(issuedLabel.url);
    } else {
      lines = lines.concat((issuedLabel.labelText || '').split('\n'));
    }
    lines.push(LABEL_END_MARKER);

    // Insert at the top of the body, each line its own paragraph, in
    // reverse so they land in the intended order. The two marker lines are
    // bookkeeping only — shrunk and colored to match the page background so
    // they're findable via getText() (used by removeExistingLabelBlock) but
    // not something a reader sees at the top of their document.
    for (var i = lines.length - 1; i >= 0; i--) {
      var para = body.insertParagraph(0, lines[i]);
      if (lines[i] === LABEL_START_MARKER || lines[i] === LABEL_END_MARKER) {
        para.editAsText().setFontSize(1).setForegroundColor('#ffffff');
      }
    }

    return { ok: true, plId: issuedLabel.plId };
  } catch (err) {
    return { ok: false, message: err.message, stack: err.stack || '' };
  }
}

function validateLabelFields(fields) {
  if (!fields || !fields.author) return 'Author is required.';
  var human = parseInt(fields.human, 10);
  var ai = parseInt(fields.ai, 10);
  if (isNaN(human) || isNaN(ai) || human + ai !== 100) {
    return 'Human % and AI % must add up to 100.';
  }
  return null;
}

// Removes a previously-inserted label block, if one exists, so re-applying
// replaces it instead of duplicating. Guards against leaving the body with
// zero children (Docs requires at least one paragraph).
function removeExistingLabelBlock(body) {
  var startIndex = findMarkerParagraphIndex(body, LABEL_START_MARKER);
  if (startIndex === -1) return;

  var endIndex = findMarkerParagraphIndex(body, LABEL_END_MARKER);
  if (endIndex === -1 || endIndex < startIndex) endIndex = startIndex;

  var removingEverything = startIndex === 0 && endIndex === body.getNumChildren() - 1;
  if (removingEverything) body.appendParagraph('');

  for (var i = endIndex; i >= startIndex; i--) {
    body.removeChild(body.getChild(i));
  }
}

function findMarkerParagraphIndex(body, marker) {
  var n = body.getNumChildren();
  for (var i = 0; i < n; i++) {
    var child = body.getChild(i);
    if (child.getType() === DocumentApp.ElementType.PARAGRAPH &&
        child.asParagraph().getText().indexOf(marker) !== -1) {
      return i;
    }
  }
  return -1;
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
