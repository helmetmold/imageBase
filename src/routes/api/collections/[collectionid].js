import dotenv from 'dotenv';
dotenv.config();

export async function get({ params }) {
  const { collectionId } = params;
  const libraryId = '402442'; // Your library ID

  try {
    const apiKey = process.env.BUNNY_API_KEY;
    const response = await fetch(`https://video.bunnycdn.com/library/${libraryId}/collections/${collectionId}?includeThumbnails=true`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      console.error('Failed to fetch collection:', response.statusText);
      return {
        status: response.status,
        body: { error: response.statusText }
      };
    }

    const collection = await response.json();
    return {
      body: collection
    };
  } catch (error) {
    console.error('Error fetching collection:', error);
    return {
      status: 500,
      body: { error: 'Internal Server Error' }
    };
  }
}
