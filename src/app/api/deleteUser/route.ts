import { getApps, cert, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

// Tarkista että process.env arvot tulevat oikein
console.log('Project ID:', process.env.FIREBASE_ADMIN_PROJECT_ID)

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
  })
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return Response.json({ error: 'User ID is required' }, { status: 400 })
  }

  try {
    await getAuth().deleteUser(userId)
    return Response.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return Response.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}