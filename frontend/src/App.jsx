import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    publication_year: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchBooks();
  }, []);

  useEffect(() => {
    if (success) {
      setTimeout(() => setSuccess(''), 2000);
    }
  }, [success]);

  const fetchBooks = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get('/api/books');
      setBooks(response.data);
    } catch (err) {
      setError('Failed to fetch books');
    }
    setLoading(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.title || !formData.author) {
      setError('Title and Author are required');
      return;
    }

    try {
      if (isEditing) {
        const response = await axios.put(`/api/books/${editingId}`, formData);
        setBooks(prev => prev.map(b => b._id === editingId ? response.data : b));
        setSuccess('Book updated successfully');
      } else {
        const response = await axios.post('/api/books', formData);
        setBooks(prev => [...prev, response.data]);
        setSuccess('Book added successfully');
      }

      setFormData({
        title: '',
        author: '',
        publication_year: ''
      });
      setIsEditing(false);
      setEditingId(null);
    } catch (err) {
      setError('Failed to save book');
    }
  };

  const handleEdit = (book) => {
    setFormData({
      title: book.title,
      author: book.author,
      publication_year: book.year
    });
    setIsEditing(true);
    setEditingId(book._id);
  };

  const handleDelete = (id) => {
    if (!confirm('Are you sure you want to delete this book?')) {
      return;
    }

    setError('');
    setSuccess('');

    axios.delete(`/api/books/${id}`).then(() => {
      setBooks(prev => prev.filter(b => b._id !== id));
      setSuccess('Book deleted successfully');
    }).catch(err => {
      setError('Failed to delete book');
    });
  };

  const handleCancel = () => {
    setFormData({
      title: '',
      author: '',
      publication_year: ''
    });
    setIsEditing(false);
    setEditingId(null);
  };

  return (
    <div>
      <header>
        <h1>Library Management System</h1>
      </header>

      <div className="container">
        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        <div className="form-section">
          <h2>{isEditing ? 'Edit Book' : 'Add New Book'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="title">Book Title</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="author">Author</label>
              <input
                type="text"
                id="author"
                name="author"
                value={formData.author}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="year">Publication Year</label>
              <input
                type="text"
                id="year"
                name="publication_year"
                value={formData.publication_year}
                onChange={handleInputChange}
                placeholder="e.g., 2024"
              />
            </div>

            <div>
              <button type="submit">{isEditing ? 'Update Book' : 'Add Book'}</button>
              {isEditing && <button type="button" onClick={handleCancel}>Cancel</button>}
            </div>
          </form>
        </div>

        <div className="books-section">
          <h2>Books in Library ({books.length})</h2>
          {loading && <div className="loading">Loading books...</div>}
          {!loading && books.length === 0 && <div className="empty-state">No books found. Add one to get started.</div>}
          {!loading && books.length > 0 && (
            <div className="book-list">
              {books.map(book => (
                <div key={book._id} className="book-card">
                  <h3>{book.title}</h3>
                  <p className="author">by {book.author}</p>
                  {book.year && <p className="year">{book.year}</p>}
                  <div className="book-actions">
                    <button onClick={() => handleEdit(book)}>Edit</button>
                    <button className="delete-btn" onClick={() => handleDelete(book._id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
