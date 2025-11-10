import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parámetros de búsqueda y filtros
    const search = searchParams.get('search') || ''
    const genre = searchParams.get('genre') || ''
    const authorName = searchParams.get('authorName') || ''
    
    // Parámetros de paginación
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50) // Máximo 50
    
    // Parámetros de ordenamiento
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const order = searchParams.get('order') || 'desc'
    
    // Validar sortBy
    const validSortFields = ['title', 'publishedYear', 'createdAt']
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt'
    
    // Validar order
    const sortOrder = order === 'asc' ? 'asc' : 'desc'
    
    // Construir condiciones de filtro
    const where: any = {}
    
    // Filtro de búsqueda por título
    if (search) {
      where.title = {
        contains: search,
        mode: 'insensitive',
      }
    }
    
    // Filtro por género exacto
    if (genre) {
      where.genre = genre
    }
    
    // Filtro por nombre de autor
    if (authorName) {
      where.author = {
        name: {
          contains: authorName,
          mode: 'insensitive',
        }
      }
    }
    
    // Calcular skip para paginación
    const skip = (page - 1) * limit
    
    // Obtener total de registros
    const total = await prisma.book.count({ where })
    
    // Obtener libros con paginación
    const books = await prisma.book.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            nationality: true,
          },
        },
      },
      orderBy: {
        [sortField]: sortOrder,
      },
      skip,
      take: limit,
    })
    
    // Calcular información de paginación
    const totalPages = Math.ceil(total / limit)
    const hasNext = page < totalPages
    const hasPrev = page > 1
    
    return NextResponse.json({
      data: books,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
      },
    })
  } catch (error) {
    console.error('Error en búsqueda de libros:', error)
    return NextResponse.json(
      { error: 'Error al buscar libros' },
      { status: 500 }
    )
  }
}
