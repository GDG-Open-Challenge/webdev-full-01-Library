# Library Management Application - Intentional Errors and Issues

This document outlines 5 intentional errors/issues mixed across the frontend and backend of the library management application. These are meant to be identified and resolved as a learning exercise.

---

## Error 1: Stale Closure in handleEdit (Frontend - Breaking)
**Location:** `frontend/src/App.jsx`, line 79

The handleEdit function captures the initial `books` array in its closure. When users edit multiple books in succession, the function references the old books array:

```javascript
const handleEdit = (book) => {
  setFormData({
    title: book.title,
    author: book.author,
    publication_year: book.year
  });
  setIsEditing(true);
  setEditingId(book._id);
  window.scrollTo(0, 0);
};
```

After adding a new book, the `books` array is updated. If a user tries to edit a book after adding one, the component uses the stale `books` reference from when the function was defined, causing incorrect data mapping or state inconsistencies.

---

## Error 2: Missing Error Handling in PUT Endpoint (Backend - Breaking)
**Location:** `backend/server.js`, line 54

The PUT /api/books/:id endpoint has improper promise error handling:

```javascript
app.put('/api/books/:id', (req, res) => {
  Book.findById(req.params.id).then(book => {
    if (book) {
      book.title = req.body.title || book.title;
      book.author = req.body.author || book.author;
      book.year = req.body.publication_year || book.year;
      book.save().then(updatedBook => {
        res.json(updatedBook);
      });
    } else {
      res.status(404).json({ error: 'Book not found' });
    }
  }).catch(err => res.status(500).json({ error: err.message }));
});
```

The nested `book.save().then()` has no error handler. If the save operation fails (e.g., validation error, database issue), the error is not caught and sent as a response, leaving the client hanging.

---

## Error 3: Memory Leak in Async State Updates (Frontend - Non-Breaking)
**Location:** `frontend/src/App.jsx`, line 10

The handleDelete function uses axios without cleanup:

```javascript
const handleDelete = (id) => {
  if (!confirm('Are you sure you want to delete this book?')) {
    return;
  }

  setError('');
  setSuccess('');

  axios.delete(`/api/books/${id}`).then(() => {
    setBooks(books.filter(b => b._id !== id));
    setSuccess('Book deleted successfully');
  }).catch(err => {
    setError('Failed to delete book');
  });
};
```

If the component unmounts before the axios request completes, the `.then()` or `.catch()` callbacks still execute and attempt to update state on an unmounted component, causing memory leaks and potential errors.

---

## Error 4: Input Type Mismatch on Year Field (Frontend - Breaking)
**Location:** `frontend/src/App.jsx`, line 151

The publication year input field is type "text" instead of "number":

```javascript
<input
  type="text"
  id="year"
  name="publication_year"
  value={formData.publication_year}
  onChange={handleInputChange}
  placeholder="e.g., 2024"
/>
```

This allows users to enter non-numeric values like "abc" or "1925x", which will be sent to the backend and stored, causing data integrity issues and unpredictable behavior when displaying or sorting by year.

---

## Error 5: API Response Structure Mismatch (Frontend/Backend - Breaking)
**Location:** `backend/server.js` (line 47) and `frontend/src/App.jsx`

The frontend sends the publication year as `publication_year` while the backend schema stores it as `year`. When the API returns the saved book, the field name differs, causing inconsistencies between the frontend form data and the backend response.

### Fix
The frontend normalizes the API response by mapping the backend `year` field to `publication_year` when updating the state. This ensures consistent data handling when adding or editing books.

Updated frontend handling:

```javascript
const response = await axios.post('/api/books', formData);

setBooks(prevBooks => [
  ...prevBooks,
  {
    ...response.data,
    publication_year: response.data.year
  }
]);
```

Frontend form submission:
```javascript
const response = await axios.post('/api/books', formData);
setBooks([...books, response.data]);
```

The response contains `year` but the frontend formData has `publication_year`. When editing, the frontend tries to populate the form with `book.year` but the input is named `publication_year`. This causes data inconsistency between what's stored, what's displayed, and what's submitted, leading to unexpected behavior when filling forms or displaying values.

---

## Summary

- **Frontend Breaking Errors:** 2 (Stale closure in handleEdit, Input type mismatch)
- **Frontend Non-Breaking Errors:** 0
- **Backend Breaking Errors:** 1 (Missing error handling in PUT)
- **Backend Non-Breaking Errors:** 1 (Memory leak in async, API response structure mismatch)

These errors demonstrate realistic issues found in production applications including asynchronous operation handling, state management pitfalls, data validation, and API contract mismatches.
