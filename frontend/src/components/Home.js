import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import '../css/home.css';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  TablePagination,
  TableSortLabel,
  TextField,
  Box,
} from '@mui/material';
import { CSVLink } from 'react-csv';

export default function Home() {
  const [books, setBooks] = useState([]);
  const [authorDetails, setAuthorDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchedDetails = useRef(false);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const bookResponse = await axios.get(
          'https://openlibrary.org/people/mekBot/books/want-to-read.json'
        );
        const booksData = bookResponse.data.reading_log_entries
          .slice(0, 100)
          .map((entry) => entry.work);
        setBooks(booksData);
        console.log('finished');
      } catch (error) {
        console.error('Error fetching books:', error);
        setError('Failed to fetch books');
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  const fetchAuthorDetails = useCallback(
    async (authorNames) => {
      const authorPromises = authorNames.map(async (authorName) => {
        if (!authorDetails[authorName]) {
          try {
            const authorResponse = await axios.get(
              `https://openlibrary.org/search/authors.json?q=${encodeURIComponent(
                authorName
              )}`
            );
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
      const newAuthorDetails = authorResults.reduce(
        (acc, curr) => ({ ...acc, ...curr }),
        {}
      );
      setAuthorDetails((prevDetails) => ({ ...prevDetails, ...newAuthorDetails }));
    },
    [authorDetails]
  );

  useEffect(() => {
    const fetchDetails = async () => {
      const authorNames = [
        ...new Set(books.map((book) => book.author_names).flat()),
      ];
      await fetchAuthorDetails(authorNames);
    };

    if (books.length > 0 && !fetchedDetails.current) {
      fetchedDetails.current = true;
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

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setPage(0);
  };

  const filteredBooks = useMemo(() => {
    return books.filter((book) =>
      book.author_names.join(', ').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [books, searchQuery]);

  const sortedBooks = useMemo(() => {
    if (!orderBy) return filteredBooks;
    const comparator = (a, b) => {
      if (b[orderBy] < a[orderBy]) {
        return order === 'asc' ? -1 : 1;
      }
      if (b[orderBy] > a[orderBy]) {
        return order === 'asc' ? 1 : -1;
      }
      return 0;
    };
    return [...filteredBooks].sort(comparator);
  }, [filteredBooks, order, orderBy]);

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <div>{error}</div>;
  }

  const csvData = [
    // Header row
    ['S.No', 'Author Name', 'Title', 'First Publish Year', 'Subject', 'Author Birth Date', 'Author Top Work'],
    // ... data rows
    ...sortedBooks.map((book, index) => {
      const author = authorDetailsMemo[book.author_names.join(', ')] || {};
      const serialNumber = page * rowsPerPage + index + 1;
      return [
        serialNumber,
        book.author_names.join(', ') || 'N/A',
        book.title || 'N/A',
        book.first_publish_year || 'N/A',
        author.top_subjects && author.top_subjects.length > 0 ? author.top_subjects[0] : 'N/A',
        author.birth_date || 'N/A',
        author.top_work || 'N/A',
      ];
    }),
  ];

  return (
    <div className='main'>
      <h1>Admin Dashboard</h1>
      <Box mb={2}>
        <TextField
          label="Search by Author"
          variant="outlined"
          fullWidth
          value={searchQuery}
          onChange={handleSearchChange}
          className='search'
          style={{ marginLeft: "-710px", width: "500px", height: "55px" , backgroundColor:"white"}}
        />
      </Box>
      <CSVLink data={csvData} filename="data.csv" className="button-3">
        Download as CSV
      </CSVLink>
      <h4>(Click on the column name to sort the data and please wait 5 mins to load the complete data!)</h4>
      <TableContainer component={Paper} style={{width:"1200px",marginLeft:"40px",border:"1px solid black"}}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell style={{fontWeight:"bold",fontStyle:"italic",color:"brown"}}>S.No</TableCell>
              <TableCell style={{fontWeight:"bold",fontStyle:"italic",color:"brown"}}>
                <TableSortLabel
                  active={orderBy === 'author_names'}
                  direction={orderBy === 'author_names' ? order : 'asc'}
                  onClick={() => handleRequestSort('author_names')}
                >
                  Author Name
                </TableSortLabel>
              </TableCell>
              <TableCell style={{fontWeight:"bold",fontStyle:"italic",color:"brown"}}>
                <TableSortLabel
                  active={orderBy === 'title'}
                  direction={orderBy === 'title' ? order : 'asc'}
                  onClick={() => handleRequestSort('title')}
                >
                  Title
                </TableSortLabel>
              </TableCell>
              <TableCell style={{fontWeight:"bold",fontStyle:"italic",color:"brown"}}>
                <TableSortLabel
                  active={orderBy === 'first_publish_year'}
                  direction={orderBy === 'first_publish_year' ? order : 'asc'}
                  onClick={() => handleRequestSort('first_publish_year')}
                >
                  First Publish Year
                </TableSortLabel>
              </TableCell>
              <TableCell style={{fontWeight:"bold",fontStyle:"italic",color:"brown"}}>
                <TableSortLabel
                  active={orderBy === 'subject'}
                  direction={orderBy === 'subject' ? order : 'asc'}
                  onClick={() => handleRequestSort('subject')}
                >
                  Subject
                </TableSortLabel>
              </TableCell>
              <TableCell style={{fontWeight:"bold",fontStyle:"italic",color:"brown"}}>Author Birth Date</TableCell>
              <TableCell style={{fontWeight:"bold",fontStyle:"italic",color:"brown"}}>
                <TableSortLabel
                  active={orderBy === 'top_work'}
                  direction={orderBy === 'top_work' ? order : 'asc'}
                  onClick={() => handleRequestSort('top_work')}
                >
                  Top Work
                </TableSortLabel>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedBooks
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((book, index) => {
                const author =
                  authorDetailsMemo[book.author_names.join(', ')] || {};
                const serialNumber = page * rowsPerPage + index + 1;

                return (
                  <TableRow key={index}>
                    <TableCell>{serialNumber}</TableCell>
                    <TableCell>
                      {book.author_names.join(', ') || 'N/A'}
                    </TableCell>
                    <TableCell>{book.title || 'N/A'}</TableCell>
                    <TableCell>{book.first_publish_year || 'N/A'}</TableCell>
                    <TableCell>
                      {author.top_subjects && author.top_subjects.length > 0
                        ? author.top_subjects[0]
                        : 'N/A'}
                    </TableCell>
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
        count={sortedBooks.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        style={{color:"black"}}
      />
    </div>
  );
}
