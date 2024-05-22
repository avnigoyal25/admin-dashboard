import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress } from '@mui/material';

export default function Home2() {
    const [books, setBooks] = useState([]);
    const [authorDetails, setAuthorDetails] = useState({});
    const [ratingDetails, setRatingDetails] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

    const fetchRatingDetails = useCallback(async (titles) => {
        const ratingPromises = titles.map(async (title) => {
          console.log(title)
            if (!ratingDetails[title]) {
                try {
                    const bookResponse = await axios.get(`https://openlibrary.org/search.json?q=${encodeURIComponent(title)}`);
                    console.log("bookresponse",bookResponse)
                    if (bookResponse.data.docs.length > 0) {
                        const bookData = bookResponse.data.docs[1] ;
                        return { [title]: bookData };
                    } else {
                        return { [title]: null };
                    }
                } catch (error) {
                    console.error('Error fetching book details:', error);
                    return { [title]: null };
                }
            }
            return null;
        });

        const ratingResults = await Promise.all(ratingPromises);
        const newRatingDetails = ratingResults.reduce((acc, curr) => ({ ...acc, ...curr }), {});
        setRatingDetails(prevDetails => ({ ...prevDetails, ...newRatingDetails }));
    }, [ratingDetails]);

    useEffect(() => {
        const fetchDetails = async () => {
            const authorNames = [...new Set(books.map(book => book.author_names).flat())];
            const titles = books.map(book => book.title);

            await Promise.all([fetchAuthorDetails(authorNames), fetchRatingDetails(titles)]);
        };

        if (books.length > 0) {
            fetchDetails();
        }
    }, [books, fetchAuthorDetails, fetchRatingDetails]);

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
                            <TableCell>Ratings Average</TableCell>
                            <TableCell>Author Name</TableCell>
                            <TableCell>Title</TableCell>
                            <TableCell>First Publish Year</TableCell>
                            <TableCell>Subject</TableCell>
                            <TableCell>Author Birth Date</TableCell>
                            <TableCell>Author Top Work</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {books.map((book, index) => {
                            const author = authorDetails[book.author_names] || {};
                            const rating = ratingDetails[book.title] || {};
                            return (
                                <TableRow key={index}>
                                    <TableCell>{rating.ratings_average || 'N/A'}</TableCell>
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
        </div>
    );
}
