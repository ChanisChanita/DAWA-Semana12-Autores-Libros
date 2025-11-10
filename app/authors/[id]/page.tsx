'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Modal from '../../components/Modal'
import LoadingSpinner, { SmallSpinner } from '../../components/LoadingSpinner'

interface Author {
  id: string
  name: string
  email: string
  bio?: string
  nationality?: string
  birthYear?: number
}

interface Book {
  id: string
  title: string
  description?: string
  isbn?: string
  publishedYear?: number
  genre?: string
  pages?: number
}

interface Stats {
  authorId: string
  authorName: string
  totalBooks: number
  firstBook: { title: string; year: number } | null
  latestBook: { title: string; year: number } | null
  averagePages: number
  genres: string[]
  longestBook: { title: string; pages: number } | null
  shortestBook: { title: string; pages: number } | null
}

export default function AuthorDetailPage() {
  const router = useRouter()
  const params = useParams()
  const authorId = params.id as string

  const [author, setAuthor] = useState<Author | null>(null)
  const [books, setBooks] = useState<Book[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isBookModalOpen, setIsBookModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Formulario de edición de autor
  const [authorForm, setAuthorForm] = useState({
    name: '',
    email: '',
    bio: '',
    nationality: '',
    birthYear: '',
  })

  // Formulario de nuevo libro
  const [bookForm, setBookForm] = useState({
    title: '',
    description: '',
    isbn: '',
    publishedYear: '',
    genre: '',
    pages: '',
  })

  useEffect(() => {
    if (authorId) {
      fetchAuthorData()
    }
  }, [authorId])

  const fetchAuthorData = async () => {
    try {
      setLoading(true)

      // Cargar datos del autor
      const authorResponse = await fetch(`/api/authors/${authorId}`)
      if (!authorResponse.ok) {
        throw new Error('Autor no encontrado')
      }
      const authorData = await authorResponse.json()
      setAuthor(authorData)
      setBooks(authorData.books || [])

      // Cargar estadísticas
      const statsResponse = await fetch(`/api/authors/${authorId}/stats`)
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }
    } catch (error) {
      console.error('Error al cargar datos:', error)
      alert('Error al cargar datos del autor')
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenEditModal = () => {
    if (author) {
      setAuthorForm({
        name: author.name,
        email: author.email,
        bio: author.bio || '',
        nationality: author.nationality || '',
        birthYear: author.birthYear?.toString() || '',
      })
      setIsEditModalOpen(true)
    }
  }

  const handleUpdateAuthor = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch(`/api/authors/${authorId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...authorForm,
          birthYear: authorForm.birthYear ? parseInt(authorForm.birthYear) : null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al actualizar autor')
      }

      await fetchAuthorData()
      setIsEditModalOpen(false)
      alert('Autor actualizado correctamente')
    } catch (error: any) {
      alert(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...bookForm,
          authorId,
          publishedYear: bookForm.publishedYear ? parseInt(bookForm.publishedYear) : null,
          pages: bookForm.pages ? parseInt(bookForm.pages) : null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al crear libro')
      }

      await fetchAuthorData()
      setIsBookModalOpen(false)
      setBookForm({
        title: '',
        description: '',
        isbn: '',
        publishedYear: '',
        genre: '',
        pages: '',
      })
      alert('Libro creado correctamente')
    } catch (error: any) {
      alert(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteBook = async (bookId: string, title: string) => {
    if (!confirm(`¿Estás seguro de eliminar el libro "${title}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/books/${bookId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al eliminar libro')
      }

      await fetchAuthorData()
      alert('Libro eliminado correctamente')
    } catch (error: any) {
      alert(error.message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100">
        <LoadingSpinner />
      </div>
    )
  }

  if (!author) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100">
      {/* Header */}
      <div className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.push('/')}
            className="text-blue-600 hover:text-blue-700 font-medium mb-4 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver al inicio
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Información del autor */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{author.name}</h1>
              <p className="text-lg text-gray-600 mb-4">{author.email}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {author.nationality && (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🌍</span>
                    <div>
                      <p className="text-sm text-gray-500">Nacionalidad</p>
                      <p className="font-medium text-gray-800">{author.nationality}</p>
                    </div>
                  </div>
                )}

                {author.birthYear && (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">📅</span>
                    <div>
                      <p className="text-sm text-gray-500">Año de Nacimiento</p>
                      <p className="font-medium text-gray-800">{author.birthYear}</p>
                    </div>
                  </div>
                )}
              </div>

              {author.bio && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500 mb-1">Biografía</p>
                  <p className="text-gray-700 leading-relaxed">{author.bio}</p>
                </div>
              )}
            </div>

            <button
              onClick={handleOpenEditModal}
              className="bg-yellow-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-yellow-600 transition-colors shadow-md ml-4"
            >
              ✏️ Editar Información
            </button>
          </div>
        </div>

        {/* Estadísticas */}
        {stats && stats.totalBooks > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">📊 Estadísticas</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                <p className="text-sm text-blue-600 font-medium mb-1">Total de Libros</p>
                <p className="text-3xl font-bold text-blue-700">{stats.totalBooks}</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                <p className="text-sm text-green-600 font-medium mb-1">Promedio de Páginas</p>
                <p className="text-3xl font-bold text-green-700">{stats.averagePages}</p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                <p className="text-sm text-purple-600 font-medium mb-1">Géneros</p>
                <p className="text-3xl font-bold text-purple-700">{stats.genres.length}</p>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                <p className="text-sm text-orange-600 font-medium mb-1">Años Activo</p>
                <p className="text-3xl font-bold text-orange-700">
                  {stats.firstBook && stats.latestBook
                    ? stats.latestBook.year - stats.firstBook.year + 1
                    : '-'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {stats.firstBook && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-sm text-gray-600 font-medium mb-2">📖 Primer Libro</p>
                  <p className="font-semibold text-gray-800">{stats.firstBook.title}</p>
                  <p className="text-sm text-gray-600">Año: {stats.firstBook.year}</p>
                </div>
              )}

              {stats.latestBook && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-sm text-gray-600 font-medium mb-2">📚 Último Libro</p>
                  <p className="font-semibold text-gray-800">{stats.latestBook.title}</p>
                  <p className="text-sm text-gray-600">Año: {stats.latestBook.year}</p>
                </div>
              )}

              {stats.longestBook && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-sm text-gray-600 font-medium mb-2">📏 Libro Más Largo</p>
                  <p className="font-semibold text-gray-800">{stats.longestBook.title}</p>
                  <p className="text-sm text-gray-600">{stats.longestBook.pages} páginas</p>
                </div>
              )}

              {stats.shortestBook && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-sm text-gray-600 font-medium mb-2">📑 Libro Más Corto</p>
                  <p className="font-semibold text-gray-800">{stats.shortestBook.title}</p>
                  <p className="text-sm text-gray-600">{stats.shortestBook.pages} páginas</p>
                </div>
              )}
            </div>

            {stats.genres.length > 0 && (
              <div className="mt-6">
                <p className="text-sm text-gray-600 font-medium mb-3">Géneros que escribe:</p>
                <div className="flex flex-wrap gap-2">
                  {stats.genres.map((genre) => (
                    <span
                      key={genre}
                      className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Lista de libros */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              📚 Libros ({books.length})
            </h2>
            <button
              onClick={() => setIsBookModalOpen(true)}
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-md flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Agregar Libro
            </button>
          </div>

          {books.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Este autor aún no tiene libros registrados
              </h3>
              <p className="text-gray-500">Agrega el primer libro de este autor</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {books.map((book) => (
                <div
                  key={book.id}
                  className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-5 border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-bold text-gray-900 line-clamp-2 flex-1">
                      {book.title}
                    </h3>
                    {book.genre && (
                      <span className="ml-2 bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
                        {book.genre}
                      </span>
                    )}
                  </div>

                  {book.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                      {book.description}
                    </p>
                  )}

                  <div className="space-y-1 mb-4">
                    {book.publishedYear && (
                      <p className="text-xs text-gray-600">📅 Año: {book.publishedYear}</p>
                    )}
                    {book.pages && (
                      <p className="text-xs text-gray-600">📄 Páginas: {book.pages}</p>
                    )}
                    {book.isbn && (
                      <p className="text-xs text-gray-600 truncate">📚 ISBN: {book.isbn}</p>
                    )}
                  </div>

                  <button
                    onClick={() => handleDeleteBook(book.id, book.title)}
                    className="w-full bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition-colors text-sm"
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal para editar autor */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Editar Información del Autor"
        size="md"
      >
        <form onSubmit={handleUpdateAuthor} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={authorForm.name}
              onChange={(e) => setAuthorForm({ ...authorForm, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={authorForm.email}
              onChange={(e) => setAuthorForm({ ...authorForm, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nacionalidad
            </label>
            <input
              type="text"
              value={authorForm.nationality}
              onChange={(e) => setAuthorForm({ ...authorForm, nationality: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Año de Nacimiento
            </label>
            <input
              type="number"
              value={authorForm.birthYear}
              onChange={(e) => setAuthorForm({ ...authorForm, birthYear: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="1800"
              max={new Date().getFullYear()}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Biografía
            </label>
            <textarea
              value={authorForm.bio}
              onChange={(e) => setAuthorForm({ ...authorForm, bio: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-blue-400 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <SmallSpinner />
                  Actualizando...
                </>
              ) : (
                'Actualizar'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal para agregar libro */}
      <Modal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        title="Agregar Nuevo Libro"
        size="lg"
      >
        <form onSubmit={handleCreateBook} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={bookForm.title}
              onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Título del libro"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Género
              </label>
              <input
                type="text"
                value={bookForm.genre}
                onChange={(e) => setBookForm({ ...bookForm, genre: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Ej: Novela"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ISBN
              </label>
              <input
                type="text"
                value={bookForm.isbn}
                onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="978-3-16-148410-0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Año de Publicación
              </label>
              <input
                type="number"
                value={bookForm.publishedYear}
                onChange={(e) => setBookForm({ ...bookForm, publishedYear: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="2024"
                min="1000"
                max={new Date().getFullYear() + 1}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Páginas
              </label>
              <input
                type="number"
                value={bookForm.pages}
                onChange={(e) => setBookForm({ ...bookForm, pages: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="250"
                min="1"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              value={bookForm.description}
              onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Breve descripción del libro..."
            />
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={() => setIsBookModalOpen(false)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:bg-green-400 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <SmallSpinner />
                  Creando...
                </>
              ) : (
                'Crear Libro'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
