'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '../components/Modal'
import LoadingSpinner, { SmallSpinner } from '../components/LoadingSpinner'
import Pagination from '../components/Pagination'

interface Author {
  id: string
  name: string
  email: string
  nationality?: string
}

interface Book {
  id: string
  title: string
  description?: string
  isbn?: string
  publishedYear?: number
  genre?: string
  pages?: number
  author: Author
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export default function BooksPage() {
  const router = useRouter()
  const [books, setBooks] = useState<Book[]>([])
  const [authors, setAuthors] = useState<Author[]>([])
  const [genres, setGenres] = useState<string[]>([])
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBook, setEditingBook] = useState<Book | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('')
  const [selectedAuthor, setSelectedAuthor] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [order, setOrder] = useState('desc')
  const [currentPage, setCurrentPage] = useState(1)

  // Formulario
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    isbn: '',
    publishedYear: '',
    genre: '',
    pages: '',
    authorId: '',
  })

  useEffect(() => {
    fetchAuthors()
    fetchBooks()
  }, [])

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchBooks()
    }, 500)

    return () => clearTimeout(delayDebounceFn)
  }, [searchTerm, selectedGenre, selectedAuthor, sortBy, order, currentPage])

  const fetchAuthors = async () => {
    try {
      const response = await fetch('/api/authors')
      const data = await response.json()
      setAuthors(data)
    } catch (error) {
      console.error('Error al cargar autores:', error)
    }
  }

  const fetchBooks = async () => {
    try {
      setSearching(true)
      const params = new URLSearchParams()
      
      if (searchTerm) params.append('search', searchTerm)
      if (selectedGenre) params.append('genre', selectedGenre)
      if (selectedAuthor) params.append('authorName', selectedAuthor)
      params.append('page', currentPage.toString())
      params.append('limit', '9')
      params.append('sortBy', sortBy)
      params.append('order', order)

      const response = await fetch(`/api/books/search?${params.toString()}`)
      const result = await response.json()
      
      setBooks(result.data)
      setPagination(result.pagination)
      
      // Extraer géneros únicos
      const uniqueGenres = Array.from(
        new Set(result.data.filter((b: Book) => b.genre).map((b: Book) => b.genre))
      ).sort()
      setGenres(uniqueGenres as string[])
    } catch (error) {
      console.error('Error al buscar libros:', error)
      alert('Error al buscar libros')
    } finally {
      setLoading(false)
      setSearching(false)
    }
  }

  const handleOpenModal = (book?: Book) => {
    if (book) {
      setEditingBook(book)
      setFormData({
        title: book.title,
        description: book.description || '',
        isbn: book.isbn || '',
        publishedYear: book.publishedYear?.toString() || '',
        genre: book.genre || '',
        pages: book.pages?.toString() || '',
        authorId: book.author.id,
      })
    } else {
      setEditingBook(null)
      setFormData({
        title: '',
        description: '',
        isbn: '',
        publishedYear: '',
        genre: '',
        pages: '',
        authorId: '',
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingBook(null)
    setFormData({
      title: '',
      description: '',
      isbn: '',
      publishedYear: '',
      genre: '',
      pages: '',
      authorId: '',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const url = editingBook ? `/api/books/${editingBook.id}` : '/api/books'
      const method = editingBook ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          publishedYear: formData.publishedYear ? parseInt(formData.publishedYear) : null,
          pages: formData.pages ? parseInt(formData.pages) : null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al guardar libro')
      }

      await fetchBooks()
      handleCloseModal()
      alert(editingBook ? 'Libro actualizado correctamente' : 'Libro creado correctamente')
    } catch (error: any) {
      alert(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`¿Estás seguro de eliminar el libro "${title}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/books/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al eliminar libro')
      }

      await fetchBooks()
      alert('Libro eliminado correctamente')
    } catch (error: any) {
      alert(error.message)
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedGenre('')
    setSelectedAuthor('')
    setSortBy('createdAt')
    setOrder('desc')
    setCurrentPage(1)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-100">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
      {/* Header */}
      <div className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">📖 Búsqueda de Libros</h1>
              <p className="text-gray-600 mt-2">Explora y gestiona la colección de libros</p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md"
            >
              ← Volver al Inicio
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros y búsqueda */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Filtros de Búsqueda</h2>
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Limpiar filtros
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Búsqueda por título */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar por título
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Ej: Cien años..."
              />
            </div>

            {/* Filtro por género */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Género
              </label>
              <select
                value={selectedGenre}
                onChange={(e) => {
                  setSelectedGenre(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Todos los géneros</option>
                {genres.map((genre) => (
                  <option key={genre} value={genre}>
                    {genre}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por autor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar por autor
              </label>
              <input
                type="text"
                value={selectedAuthor}
                onChange={(e) => {
                  setSelectedAuthor(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Nombre del autor"
              />
            </div>

            {/* Ordenamiento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ordenar por
              </label>
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="createdAt">Fecha creación</option>
                  <option value="title">Título</option>
                  <option value="publishedYear">Año publicación</option>
                </select>
                <button
                  onClick={() => setOrder(order === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  title={order === 'asc' ? 'Ascendente' : 'Descendente'}
                >
                  {order === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Botón crear libro y resultados */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Resultados</h2>
            {pagination && (
              <p className="text-gray-600 mt-1">
                {searching ? (
                  <span className="flex items-center gap-2">
                    <SmallSpinner /> Buscando...
                  </span>
                ) : (
                  `${pagination.total} ${pagination.total === 1 ? 'libro encontrado' : 'libros encontrados'}`
                )}
              </p>
            )}
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors shadow-md flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Libro
          </button>
        </div>

        {/* Lista de libros */}
        {books.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <svg className="w-24 h-24 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No se encontraron libros</h3>
            <p className="text-gray-500">Intenta ajustar los filtros de búsqueda</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {books.map((book) => (
                <div
                  key={book.id}
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow p-6 border border-gray-100"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-bold text-gray-900 line-clamp-2 flex-1">
                      {book.title}
                    </h3>
                    {book.genre && (
                      <span className="ml-2 bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
                        {book.genre}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-blue-600 font-medium mb-2">
                    👤 {book.author.name}
                  </p>

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
                      <p className="text-xs text-gray-600">📚 ISBN: {book.isbn}</p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenModal(book)}
                      className="flex-1 bg-yellow-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-yellow-600 transition-colors text-sm"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => handleDelete(book.id, book.title)}
                      className="bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition-colors text-sm"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Paginación */}
            {pagination && pagination.totalPages > 1 && (
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
                hasNext={pagination.hasNext}
                hasPrev={pagination.hasPrev}
              />
            )}
          </>
        )}
      </div>

      {/* Modal para crear/editar libro */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingBook ? 'Editar Libro' : 'Nuevo Libro'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Título del libro"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Autor <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.authorId}
                onChange={(e) => setFormData({ ...formData, authorId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Selecciona un autor</option>
                {authors.map((author) => (
                  <option key={author.id} value={author.id}>
                    {author.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Género
              </label>
              <input
                type="text"
                value={formData.genre}
                onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Ej: Novela, Cuento"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ISBN
              </label>
              <input
                type="text"
                value={formData.isbn}
                onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="978-3-16-148410-0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Año de Publicación
              </label>
              <input
                type="number"
                value={formData.publishedYear}
                onChange={(e) => setFormData({ ...formData, publishedYear: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                value={formData.pages}
                onChange={(e) => setFormData({ ...formData, pages: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="250"
                min="1"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Breve descripción del libro..."
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={handleCloseModal}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:bg-purple-400 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <SmallSpinner />
                  Guardando...
                </>
              ) : (
                editingBook ? 'Actualizar' : 'Crear Libro'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
