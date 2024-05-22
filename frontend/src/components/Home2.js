import React, { useEffect, useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, TablePagination, TableSortLabel } from '@mui/material';

export default function Home2() {
  const [books, setBooks] = useState([]);
  const [authorDetails, setAuthorDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('');

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const bookResponse = await axios.get('https://openlibrary.org/people/mekBot/books/want-to-read.json');
        const booksData = bookResponse.data.reading_log_entries.map(entry => entry.work);
        setBooks(booksData);
      } catch (error) {
        console.error('Error fetching books:', error);
        setError('Failed to fetch books');
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  const fetchAuthorDetails = useCallback(async (authorNames) => {
    const authorPromises = authorNames.map(async (authorName) => {
      if (!authorDetails[authorName]) {
        try {
          const authorResponse = await axios.get(`https://openlibrary.org/search/authors.json?q=${encodeURIComponent(authorName)}`);
          if (authorResponse.data.docs.length > 0) {
            const authorData = authorResponse.data.docs[0];
            return { [authorName]: authorData };
          } else {
            return { [authorName]: null };
          }
        } catch (error) {
          console.error('Error fetching author details:', error);
          return { [authorName]: null };
        }
      }
      return null;
    });

    const authorResults = await Promise.all(authorPromises);
    const newAuthorDetails = authorResults.reduce((acc, curr) => ({ ...acc, ...curr }), {});
    setAuthorDetails(prevDetails => ({ ...prevDetails, ...newAuthorDetails }));
  }, [authorDetails]);

  useEffect(() => {
    const fetchDetails = async () => {
      const authorNames = [...new Set(books.map(book => book.author_names).flat())];
      await Promise.all([fetchAuthorDetails(authorNames)]);
    };

    if (books.length > 0) {
      fetchDetails();
    }
  }, [books, fetchAuthorDetails]);

  const authorDetailsMemo = useMemo(() => authorDetails, [authorDetails]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedBooks = useMemo(() => {
    const comparator = (a, b) => {
      if (b[orderBy] < a[orderBy]) {
        return order === 'asc' ? -1 : 1;
      }
      if (b[orderBy] > a[orderBy]) {
        return order === 'asc' ? 1 : -1;
      }
      return 0;
    };
    return [...books].sort(comparator);
  }, [books, order, orderBy]);

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>S.No</TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'author_names'}
                  direction={orderBy === 'author_names' ? order : 'asc'}
                  onClick={() => handleRequestSort('author_names')}
                >
                  Author Name
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'title'}
                  direction={orderBy === 'title' ? order : 'asc'}
                  onClick={() => handleRequestSort('title')}
                >
                  Title
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'first_publish_year'}
                  direction={orderBy === 'first_publish_year' ? order : 'asc'}
                  onClick={() => handleRequestSort('first_publish_year')}
                >
                  First Publish Year
                </TableSortLabel>
              </TableCell>
              <TableCell>Subject</TableCell>
              <TableCell>Author Birth Date</TableCell>
              <TableCell>Author Top Work</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedBooks.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((book, index) => {
              const author = authorDetailsMemo[book.author_names.join(', ')] || {};
              const serialNumber = page * rowsPerPage + index + 1;

              return (
                <TableRow key={index}>
                  <TableCell>{serialNumber}</TableCell>
                  <TableCell>{book.author_names.join(', ') || 'N/A'}</TableCell>
                  <TableCell>{book.title || 'N/A'}</TableCell>
                  <TableCell>{book.first_publish_year || 'N/A'}</TableCell>
                  <TableCell>{author.top_subjects && author.top_subjects.length > 0 ? author.top_subjects[0] : 'N/A'}</TableCell>
                  <TableCell>{author.birth_date || 'N/A'}</TableCell>
                  <TableCell>{author.top_work || 'N/A'}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 25, 50, 100]}
        component="div"
        count={books.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </div>
  );
}
