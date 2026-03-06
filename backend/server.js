const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const Book = require('./models/Book');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/library_management')
  .then(() => {
    console.log('MongoDB connected');
    seedDatabase();
  })
  .catch(err => console.error('MongoDB connection error:', err));

async function seedDatabase() {
  const count = await Book.countDocuments();
  if (count === 0) {
    const initialBooks = [
      { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', year: 1925 },
      { title: 'To Kill a Mockingbird', author: 'Harper Lee' }
    ];
    await Book.insertMany(initialBooks);
  }
}

app.get('/api/books', async (req, res) => {
  const books = await Book.find();
  res.json(books);
});

app.get('/api/books/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (book) {
      res.json(book);
    } else {
      res.status(404).json({ error: 'Book not found' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Invalid book ID' });
  }
});

app.post('/api/books', async (req, res) => {
  const newBook = new Book({
    title: req.body.title,
    author: req.body.author,
    year: req.body.publication_year
  });
  
  const savedBook = await newBook.save();
  res.status(201).json(savedBook);
});

app.put('/api/books/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    book.title = req.body.title || book.title;
    book.author = req.body.author || book.author;
    book.year = req.body.publication_year || book.year;

    const updatedBook = await book.save();

    res.json(updatedBook);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update book' });
  }
});

app.delete('/api/books/:id', async (req, res) => {
  const result = await Book.findByIdAndDelete(req.params.id);
  
  if (result) {
    res.json({ message: 'Book deleted' });
  } else {
    res.status(404).json({ error: 'Book not found' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
