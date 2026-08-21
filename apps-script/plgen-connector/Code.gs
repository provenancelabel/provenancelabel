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

// Tags the paragraphs holding the currently-applied label with a Docs
// NamedRange (metadata Apps Script can look up later — not text, never
// rendered on the page), so re-issuing replaces the old block instead of
// stacking duplicates without inserting any marker content into the doc.
var LABEL_RANGE_NAME = 'plgenLabel';

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
// object issueLabel() returned. Inserts the label at the top of the doc and
// tags it with a NamedRange. Re-issuing and re-applying replaces the old
// block rather than stacking a new one, so the doc's own (native) revision
// history shows the latest PL in its latest revision without any custom
// timestamp logic — and nothing about the mechanism is visible on the page.
function applyLabelToDocument(issuedLabel) {
  try {
    if (!issuedLabel || !issuedLabel.ok || !issuedLabel.plId) {
      return { ok: false, message: 'No issued label to apply — issue one first.' };
    }

    var doc  = DocumentApp.getActiveDocument();
    var body = doc.getBody();
    removeExistingLabelBlock(doc, body);

    var lines = issuedLabel.tier === 'registered'
      ? ['Provenance Label: ' + issuedLabel.plId, issuedLabel.url]
      : (issuedLabel.labelText || '').split('\n');

    // Insert at the top of the body, each line its own paragraph, in
    // reverse so they land in the intended order.
    var inserted = [];
    for (var i = lines.length - 1; i >= 0; i--) {
      inserted.unshift(body.insertParagraph(0, lines[i]));
    }

    // Tag the whole block with a NamedRange so a later apply can find and
    // remove exactly this content — no marker text goes into the document
    // itself, visible or otherwise.
    var rangeBuilder = doc.newRange();
    inserted.forEach(function (p) { rangeBuilder.addElement(p); });
    doc.addNamedRange(LABEL_RANGE_NAME, rangeBuilder.build());

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

// Removes a previously-applied label block, if one exists, using the
// NamedRange tag left by a prior apply (no marker text to search for).
// Guards against leaving the body with zero children (Docs requires at
// least one paragraph).
function removeExistingLabelBlock(doc, body) {
  var namedRanges = doc.getNamedRanges(LABEL_RANGE_NAME);

  namedRanges.forEach(function (namedRange) {
    var elements = namedRange.getRange().getRangeElements().map(function (rangeElement) {
      return rangeElement.getElement();
    });

    if (body.getNumChildren() - elements.length < 1) body.appendParagraph('');

    // Remove in reverse document order so earlier indices stay valid.
    for (var i = elements.length - 1; i >= 0; i--) {
      body.removeChild(elements[i]);
    }
    namedRange.remove(); // clears the tag itself; content is already gone
  });
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
