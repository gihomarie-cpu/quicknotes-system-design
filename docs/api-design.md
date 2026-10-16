
//Rest APi for design api

# QuickNotes REST API Design

This document describes the real QuickNotes backend API, not the JSONPlaceholder practice API. Base URL: `https://api.quicknotes.example/v1`. Requests and responses use JSON. Protected routes require `Authorization: Bearer <access-token>`. The server derives the note owner from the authenticated identity; it must not trust a client-supplied `userId`.

## Endpoint list

| Method | Path | Description | Success |
|---|---|---|---|
| GET | `/v1/notes` | List the current user's notes; supports `limit` and `cursor`. | `200 OK` |
| GET | `/v1/notes/{noteId}` | Retrieve one note owned by the current user. | `200 OK` |
| POST | `/v1/notes` | Create a note. | `201 Created` |
| PATCH | `/v1/notes/{noteId}` | Update supplied fields of a note. | `200 OK` |
| DELETE | `/v1/notes/{noteId}` | Delete a note. | `204 No Content` |
| GET | `/v1/notes/search?q={term}` | Search the user's notes by title or body. | `200 OK` |
| GET | `/v1/tags` | List the user's tags. | `200 OK` |
| POST | `/v1/notes/{noteId}/tags` | Attach an existing tag to a note. | `200 OK` |

## List notes example

`GET /v1/notes?limit=20`

Response (`200 OK`):

```json
{
  "data": [
    {
      "id": "note_101",
      "title": "Revision plan",
      "body": "Review database normalization.",
      "userId": "user_12",
      "createdAt": "2026-10-15T08:30:00Z",
      "updatedAt": "2026-10-15T08:30:00Z"
    }
  ],
  "pagination": { "limit": 20, "nextCursor": null }
}
```

## Create note example

`POST /v1/notes`

Request body:

```json
{ "title": "Revision plan", "body": "Review database normalization." }
```

Response (`201 Created`):

```json
{
  "data": {
    "id": "note_101",
    "title": "Revision plan",
    "body": "Review database normalization.",
    "userId": "user_12",
    "createdAt": "2026-10-15T08:30:00Z",
    "updatedAt": "2026-10-15T08:30:00Z"
  }
}
```

The server should also send `Location: /v1/notes/note_101`.

## Other endpoint details

- `GET /v1/notes/note_101`: returns the note as JSON with `200 OK`.
- `PATCH /v1/notes/note_101` with `{"title":"Updated plan"}`: updates only supplied fields and returns the updated note with `200 OK`.
- `DELETE /v1/notes/note_101`: deletes the note and returns `204 No Content` with no response body.
- `GET /v1/notes/search?q=database`: returns matching notes and pagination metadata with `200 OK`.
- `GET /v1/tags`: returns the user's tags with `200 OK`.
- `POST /v1/notes/note_101/tags` with `{"tagId":"tag_7"}`: attaches the tag and returns the relationship/result with `200 OK`; duplicate relationships are not created.

## Error status codes

Use a consistent response envelope:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The title field is required."
  }
}
```

| Status | Meaning | Example |
|---|---|---|
| `400 Bad Request` | Invalid JSON or invalid field values. | Empty title. |
| `401 Unauthorized` | Missing, invalid, or expired authentication. | No valid bearer token. |
| `403 Forbidden` | Authenticated user lacks permission. | Forbidden administrative operation. |
| `404 Not Found` | Resource is missing or not visible to caller. | Unknown note ID. |
| `500 Internal Server Error` | Unexpected server-side failure. | Unhandled application/database error. |

Example error body:

```json
{
  "error": {
    "code": "NOTE_NOT_FOUND",
    "message": "The requested note was not found."
  }
}
```

Production design notes: require HTTPS, validate on the server, enforce note ownership for every operation, paginate list results, rate-limit requests, and never store passwords in plain text.
