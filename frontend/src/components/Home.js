import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';


export default function Home() {
    const [books, setBooks] = useState([]);
    const [authorDetails, setAuthorDetails] = useState({});
    const [ratingDetails, setRatingDetails] = useState({});

    useEffect(() => {
        const fetchBooks = async () => {
            try {
                const bookResponse = await axios.get('https://openlibrary.org/people/mekBot/books/want-to-read.json');
                const booksData = bookResponse.data.reading_log_entries.map(entry => entry.work);
                setBooks(booksData);
            } catch (error) {
                console.error('Error fetching books:', error);
            }
        };

        fetchBooks();
    }, []);

    const findAuthorDetails = useCallback (async (authorName) => {
        try {
            if (!authorDetails[authorName]) {
                const authorResponse = await axios.get(`https://openlibrary.org/search/authors.json?q=${encodeURIComponent(authorName)}`);
                // console.log('API response for author:', authorName, authorResponse.data);
                if (authorResponse.data.docs.length > 0) {
                    const authorData = authorResponse.data.docs[0] || authorResponse.data.docs[1];
                    setAuthorDetails(prevDetails => ({ ...prevDetails, [authorName]: authorData }));
                } else {
                    setAuthorDetails(prevDetails => ({ ...prevDetails, [authorName]: null }));
                }
            }
        } catch (error) {
            console.error('Error fetching author details:', error);
            setAuthorDetails(prevDetails => ({ ...prevDetails, [authorName]: null }));
        }
    }, [authorDetails]);

    const findRatingDetails = useCallback(async (title) => {
        console.log(title)
        try {
            if (!ratingDetails[title]) {
                const bookResponse = await axios.get(`https://openlibrary.org/search.json?q=${encodeURIComponent(title)}`);
                console.log('API response for book:', title, bookResponse.data);
                if (bookResponse.data.docs.length > 0) {
                    const bookData = bookResponse.data.docs[1] || bookResponse.data.docs[0];
                    setRatingDetails(prevDetails => ({ ...prevDetails, [title]: bookData }));
                } else {
                    setRatingDetails(prevDetails => ({ ...prevDetails, [title]: null }));
                }
            }
        } catch (error) {
            console.error('Error fetching book details:', error);
            setRatingDetails(prevDetails => ({ ...prevDetails, [title]: null }));
        }
    }, [ratingDetails]);
    useEffect(() => {
        const fetchAuthors = async () => {
            for (let book of books) {
                await findAuthorDetails(book.author_names);
                await findRatingDetails(book.title);
            }
        };

        if (books.length > 0) {
            fetchAuthors();
        }
    }, [books, findAuthorDetails, findRatingDetails]);

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
                            const subject = ratingDetails[book.title] || {};
                            return (
                                <TableRow key={index}>
                                    <TableCell>{subject.ratings_average || 'N/A'}</TableCell>
                                    <TableCell>{book.author_names}</TableCell>
                                    <TableCell>{book.title}</TableCell>
                                    <TableCell>{book.first_publish_year}</TableCell>
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
