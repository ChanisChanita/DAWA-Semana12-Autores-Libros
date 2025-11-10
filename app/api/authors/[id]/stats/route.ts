import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Verificar que el autor existe
    const author = await prisma.author.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
      },
    })

    if (!author) {
      return NextResponse.json(
        { error: 'Autor no encontrado' },
        { status: 404 }
      )
    }

    // Obtener todos los libros del autor
    const books = await prisma.book.findMany({
      where: { authorId: id },
      select: {
        id: true,
        title: true,
        publishedYear: true,
        pages: true,
        genre: true,
      },
      orderBy: {
        publishedYear: 'asc',
      },
    })

    // Si no tiene libros, devolver estadísticas vacías
    if (books.length === 0) {
      return NextResponse.json({
        authorId: author.id,
        authorName: author.name,
        totalBooks: 0,
        firstBook: null,
        latestBook: null,
        averagePages: 0,
        genres: [],
        longestBook: null,
        shortestBook: null,
      })
    }

    // Calcular estadísticas
    const totalBooks = books.length

    // Libros con año publicado (filtrar nulls)
    const booksWithYear = books.filter(book => book.publishedYear !== null)
    
    // Primer y último libro
    const firstBook = booksWithYear.length > 0
      ? {
          title: booksWithYear[0].title,
          year: booksWithYear[0].publishedYear,
        }
      : null

    const latestBook = booksWithYear.length > 0
      ? {
          title: booksWithYear[booksWithYear.length - 1].title,
          year: booksWithYear[booksWithYear.length - 1].publishedYear,
        }
      : null

    // Calcular promedio de páginas (solo libros con páginas definidas)
    const booksWithPages = books.filter(book => book.pages !== null)
    const averagePages = booksWithPages.length > 0
      ? Math.round(
          booksWithPages.reduce((sum, book) => sum + (book.pages || 0), 0) /
            booksWithPages.length
        )
      : 0

    // Géneros únicos (filtrar nulls y duplicados)
    const genres = Array.from(
      new Set(books.filter(book => book.genre).map(book => book.genre))
    ).sort()

    // Libro con más páginas
    const longestBook = booksWithPages.length > 0
      ? booksWithPages.reduce((max, book) =>
          (book.pages || 0) > (max.pages || 0) ? book : max
        )
      : null

    const longestBookData = longestBook
      ? {
          title: longestBook.title,
          pages: longestBook.pages,
        }
      : null

    // Libro con menos páginas
    const shortestBook = booksWithPages.length > 0
      ? booksWithPages.reduce((min, book) =>
          (book.pages || 0) < (min.pages || 0) ? book : min
        )
      : null

    const shortestBookData = shortestBook
      ? {
          title: shortestBook.title,
          pages: shortestBook.pages,
        }
      : null

    return NextResponse.json({
      authorId: author.id,
      authorName: author.name,
      totalBooks,
      firstBook,
      latestBook,
      averagePages,
      genres,
      longestBook: longestBookData,
      shortestBook: shortestBookData,
    })
  } catch (error) {
    console.error('Error al obtener estadísticas:', error)
    return NextResponse.json(
      { error: 'Error al obtener estadísticas del autor' },
      { status: 500 }
    )
  }
}
