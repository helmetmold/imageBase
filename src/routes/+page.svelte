<script lang="ts">
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import { createClient } from '@supabase/supabase-js';
	import BunnyVideo from '$lib/components/BunnyVideo.svelte';

	interface Image {
		src: string;
		category: string;
	}

	interface CollectionItem {
		name: string;
		guid: string;
		// Add other video properties if needed
	}

	interface Collection {
		name: string;
		guid: string;
		videoLibraryId: number;
		items: CollectionItem[];
		videoCount?: number;
		totalSize?: number;
		previewVideoIds?: string;
	}

	let images: Image[] = [];
	let categories: string[] = [];
	let selectedCategory = 'all';
	let filteredImages: Image[] = [];
	let isLoading = true; // Loading state for images
	let isVideoLoading = false; // Loading state for videos

	// Lightbox state
	const showLightbox = writable(false);
	let currentImage: Image | null = null;

	// State to manage the collapse of each section
	let isImagesCollapsed = true;
	let isVideosCollapsed = true;

	// Initialize Supabase client
	const supabaseUrl = 'https://kfeprdcotfmvpfkjdthc.supabase.co';
	const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmZXByZGNvdGZtdnBma2pkdGhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE2NzM5ODMsImV4cCI6MjA0NzI0OTk4M30.BH5shEVUATHZbep-cXYlHY8FtRt-VROlP6A1-BOi5es'; // Replace with your Supabase anon key
	const supabase = createClient(supabaseUrl, supabaseAnonKey);

	let collections: Collection[] = [];
	let mainVideoID = ''; // Set this to the ID of the main video if needed
	let collectionNames: string[] = [];
	let selectedCollection: Collection | null = null; // Track the selected collection

	function handleThumbnailClick(videoID: string) {
		console.log('Thumbnail clicked:', videoID);
		// Implement your logic here
	}

	onMount(async () => {
		try {
			// List folders in 'youtube-camp-assets' to get categories
			const { data: folders, error: folderError } = await supabase
				.storage
				.from('images')
				.list('youtube-camp-assets', { limit: 100 });

			if (folderError) {
				throw folderError;
			}

			// Use Promise.all to fetch images from all folders concurrently
			const imagePromises = folders.map(async (folder) => {
				if (folder.name) {
					const { data: files, error: fileError } = await supabase
						.storage
						.from('images')
						.list(`youtube-camp-assets/${folder.name}`, { limit: 100 });

					if (fileError) {
						console.error('Error loading files:', fileError);
						return [];
					}

					return files.map(file => ({
						src: supabase.storage.from('images').getPublicUrl(`youtube-camp-assets/${folder.name}/${file.name}`).data.publicUrl,
						category: folder.name
					}));
				}
				return [];
			});

			// Wait for all image loading promises to resolve
			const loadedImagesArray = await Promise.all(imagePromises);

			console.log('Loaded images:', loadedImagesArray);
			images = loadedImagesArray.flat();

			isLoading = false;


			// Extract unique categories
			categories = ['all', ...new Set(images.map(image => image.category))];
			console.log('Categories:', categories);

			// Initialize filteredImages
			filteredImages = filterImages();

			  // Define your Bunny.net library ID and Access Key
			const libraryId = '402442'; // Replace with your actual Library ID
			const accessKey = 'ee8a31f8-ec3a-4bc1-b671cfea5e66-c65a-4d7a'; // Replace with your actual Access Key

			// Fetch collections from Bunny.net
			const response = await fetch(`https://video.bunnycdn.com/library/${libraryId}/collections`, {
				method: 'GET',
				headers: {
				'AccessKey': accessKey
				}
			});

			if (!response.ok) throw new Error('Failed to fetch collections');

			const collectionsData = await response.json();
			console.log('Collections Data:', collectionsData);

			// Access the items array within the collectionsData object
			if (collectionsData && Array.isArray(collectionsData.items)) {
				collections = collectionsData.items;

				// Filter out "Cartoon Animators Camp" from collection names
				collectionNames = collections
					.filter(collection => collection.name !== "Cartoon Animators Camp")
					.map(collection => collection.name);
				console.log('Collection Names:', collectionNames);
			} else {
				console.error('Expected an array but got:', collectionsData);
				throw new Error('Invalid data format');
			}
		} catch (error) {
			console.error('Error loading collections:', error);
			collectionNames = []; // Initialize as empty array if there's an error
		}
	});

	// Reactive statement to ensure re-render
	$: {
		filteredImages = filterImages();
		console.log('Filtered images on category change:', filteredImages);
	}

	function filterImages() {
		console.log('Filtering images for category:', selectedCategory);
		return selectedCategory === 'all'
			? images
			: images.filter(image => image.category === selectedCategory);
	}

	function selectCategory(category: string) {
		selectedCategory = category;
		filteredImages = filterImages();
		selectedCollection = null; // Reset selected collection when switching to images
	}

	function openLightbox(image: Image) {
		console.log('Opening lightbox for image:', image);
		currentImage = image;
		showLightbox.set(true);
	}

	function closeLightbox() {
		showLightbox.set(false);
		currentImage = null;
	}

	function getFileNameFromUrl(url: string): string {
		const decodedUrl = decodeURIComponent(url);
		return decodedUrl.split('/').pop() || 'download';
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			closeLightbox();
		}
	}

	async function toggleCollapse(section: string) {
		if (section === 'images') {
			isImagesCollapsed = !isImagesCollapsed;
			isVideosCollapsed = true;
		} else if (section === 'videos') {
			isVideosCollapsed = !isVideosCollapsed;
			isImagesCollapsed = true;
		}
	}

	async function handleVideoCategory(collectionName: string) {
		const collection = collections.find((c: Collection) => c.name === collectionName);
		if (!collection) return;

		isVideoLoading = true; // Set video loading state to true

		try {
			// Fetch videos for the selected collection
			const response = await fetch(`https://video.bunnycdn.com/library/${collection.videoLibraryId}/videos?collection=${collection.guid}`, {
				method: 'GET',
				headers: {
					'AccessKey': 'ee8a31f8-ec3a-4bc1-b671cfea5e66-c65a-4d7a'
				}
			});

			if (!response.ok) throw new Error('Failed to fetch videos');

			const videosData = await response.json();
			console.log('Videos Data:', videosData);

			// Update the selectedCollection with the fetched videos
			selectedCollection = {
				...collection,
				items: videosData.items.map((video: any) => ({
					name: video.title,
					guid: video.guid
					// Add other video properties as needed
				}))
			};
			console.log('Updated Selected Collection:', selectedCollection);
		} catch (error) {
			console.error('Error loading videos:', error);
			selectedCollection = null;
		} finally {
			isVideoLoading = false; // Reset video loading state
		}
	}
</script>

<section class="flex w-full h-full">
	<!-- Sidebar for Category Filter -->
	<div class="sidebar w-64 bg-gray-900 text-white p-4">
		<h2 class="text-xl font-bold mb-4">Menu</h2>
		<div class="flex flex-col space-y-4">
			<!-- Images Section -->
			<div class="border-b border-gray-700">
				<button class="w-full flex justify-between items-center py-5 text-white" on:click={() => toggleCollapse('images')}>
					<span>Images</span>
					<span class="transition-transform duration-300" style="transform: rotate({isImagesCollapsed ? 0 : 180}deg);">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="w-4 h-4">
							<path fill-rule="evenodd" d="M11.78 9.78a.75.75 0 0 1-1.06 0L8 7.06 5.28 9.78a.75.75 0 0 1-1.06-1.06l3.25-3.25a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06Z" clip-rule="evenodd" />
						</svg>
					</span>
				</button>
				<div class="overflow-hidden transition-all duration-300 ease-in-out" style="max-height: {isImagesCollapsed ? '0' : '1000px'};">
					<div class="flex flex-col">
						{#each categories as category}
							<button
								type="button"
								class="p-2 border-b last:border-b-0 text-left font-bold capitalize text-lg {selectedCategory === category ? 'bg-[#28B9EB] text-white' : 'bg-gray-800 text-white'}"
								on:click={() => selectCategory(category)}
							>
								{category}
							</button>
						{/each}
					</div>
				</div>
			</div>

			<!-- Videos Section -->
			<div class="border-b border-gray-700">
				<button class="w-full flex justify-between items-center py-5 text-white" on:click={() => toggleCollapse('videos')}>
					<span>Videos</span>
					<span class="transition-transform duration-300" style="transform: rotate({isVideosCollapsed ? 0 : 180}deg);">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="w-4 h-4">
							<path fill-rule="evenodd" d="M11.78 9.78a.75.75 0 0 1-1.06 0L8 7.06 5.28 9.78a.75.75 0 0 1-1.06-1.06l3.25-3.25a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06Z" clip-rule="evenodd" />
						</svg>
					</span>
				</button>
				<div class="overflow-hidden transition-all duration-300 ease-in-out" style="max-height: {isVideosCollapsed ? '0' : '1000px'};">
					<div class="flex flex-col">
						{#each collectionNames as collectionName}
							<button 
								type="button" 
								class="p-2 border-b last:border-b-0 text-left font-bold capitalize text-lg bg-gray-800 text-white"
								on:click={() => handleVideoCategory(collectionName)}
							>
								{collectionName}
							</button>
						{/each}
					</div>
				</div>
			</div>

			<!-- 2D Cartoon Animators Section -->
			<div class="border-b border-gray-700">
				<button 
					class="w-full flex justify-between items-center py-5 text-white" 
					on:click={async () => {
						const animatorCollectionId = '2701dfe5-2cb7-46f0-ba1d-ac1022fe9e56';
						const collection = collections.find((c: Collection) => c.guid === animatorCollectionId);
						if (collection) {
							await handleVideoCategory(collection.name);
						}
					}}
				>
					<span>2D Cartoon Animators</span>
				</button>
			</div>
		</div>
	</div>

	<!-- Main Content -->
	<div class="main-content flex-1 px-6">
		{#if isLoading || isVideoLoading}
			<!-- Loading Indicator -->
			<div class="flex justify-center items-center h-64">
				<div class="loader"></div>
			</div>
		{:else if selectedCollection}
			<!-- Video Gallery -->
			<div class="flex flex-col gap-4">
				<div>
					<h2 class="text-xl font-bold mb-4 text-white">{selectedCollection.name}</h2>
				</div>
				<div class="flex flex-row flex-wrap gap-4">
					{#each selectedCollection.items as video}
						<BunnyVideo
							videoID={video.guid}
							{handleThumbnailClick}
							{mainVideoID}
						/>
					{/each}
				</div>
			</div>
		{:else}
			<!-- Image Tiles -->
			<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 w-full gap-6">
				{#each filteredImages as image}
					<button class="relative rounded-md shadow-md bg-neutral-900 aspect-square max-w-sm" on:click={() => openLightbox(image)} aria-label="Open image lightbox">
						<img src={image.src} alt="{image.category} image" class="w-full h-full object-cover cursor-pointer" />
					</button>
				{/each}
			</div>
		{/if}
	</div>
</section>

{#if $showLightbox && currentImage}
	<div class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" on:click={closeLightbox} on:keydown={handleKeydown}>
		<div class="relative bg-white rounded-lg aspect-square w-[600px]" on:click|stopPropagation>
			<img src={currentImage.src} alt="Lightbox image" class="max-w-full max-h-full object-contain w-full h-full p-6" />
			<a href={currentImage.src} download={getFileNameFromUrl(currentImage.src)} class="flex flex-row items-center gap-4 absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-[#28B9EB] text-white font-bold py-4 px-6 rounded-full" aria-label="Download image" on:click|stopPropagation>
				Download
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="w-4 h-4">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3" />
				</svg>
			</a>
			<button on:click={closeLightbox} class="absolute top-2 left-2 bg-white text-black p-2 rounded-full" aria-label="Close lightbox">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="w-6 h-6">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>
	</div>
{/if}

<style>
	.sidebar {
		height: 100vh;
		overflow-y: auto;
		box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
	}

	.main-content {
		padding: 1.5rem;
	}

	.loader {
		border: 8px solid #f3f3f3;
		border-top: 8px solid #3498db;
		border-radius: 50%;
		width: 50px;
		height: 50px;
		animation: spin 2s linear infinite;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.video-gallery {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: 16px;
	}
</style>