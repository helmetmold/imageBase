<script lang="ts">
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import { createClient } from '@supabase/supabase-js';

	interface Image {
		src: string;
		category: string;
	}

	let images: Image[] = [];
	let categories: string[] = [];
	let selectedCategory = 'all';
	let filteredImages: Image[] = [];
	let isLoading = true; // Loading state

	// Lightbox state
	const showLightbox = writable(false);
	let currentImage: Image | null = null;

	// Initialize Supabase client
	const supabaseUrl = 'https://kfeprdcotfmvpfkjdthc.supabase.co';
	const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmZXByZGNvdGZtdnBma2pkdGhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE2NzM5ODMsImV4cCI6MjA0NzI0OTk4M30.BH5shEVUATHZbep-cXYlHY8FtRt-VROlP6A1-BOi5es'; // Replace with your Supabase anon key
	const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
			images = loadedImagesArray.flat();

			console.log('Loaded images:', images);

			// Extract unique categories
			categories = ['all', ...new Set(images.map(image => image.category))];
			console.log('Categories:', categories);

			// Initialize filteredImages
			filteredImages = filterImages();
			console.log('Filtered images on load:', filteredImages);
		} catch (error) {
			console.error('Error loading images:', error);
		} finally {
			isLoading = false; // Set loading to false once images are loaded
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
</script>

<section class="w-full px-6">
	{#if isLoading}
		<!-- Loading Indicator -->
		<div class="flex justify-center items-center h-64">
			<div class="loader"></div> <!-- You can replace this with any loading spinner or message -->
		</div>
	{:else}
		<!-- Category Filter -->
		<div class="mb-12 flex flex-wrap justify-center">
			{#each categories as category}
				<button
					type="button"
					class="p-2 border rounded-full m-1 px-4 font-bold capitalize text-lg {selectedCategory === category ? 'bg-[#28B9EB] text-white' : 'bg-white text-black'}"
					on:click={() => selectCategory(category)}
				>
					{category}
				</button>
			{/each}
		</div>

		<!-- Image Tiles -->
		<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 w-full gap-6">
			{#each filteredImages as image}
				<button class="relative rounded-lg shadow-md bg-white aspect-square max-w-sm" on:click={() => openLightbox(image)} aria-label="Open image lightbox">
					<div class="absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.9)] via-transparent to-transparent">
						<p class="absolute bottom-2 left-4 text-white font-bold py-1 text-md z-10 capitalize">
							{getFileNameFromUrl((image.src.split('/').pop() || '').split('.')[0])}
						</p>
					</div>
					<img src={image.src} alt="{image.category} image" class="w-full h-full object-cover cursor-pointer" />
				</button>
			{/each}
		</div>
	{/if}
</section>

{#if $showLightbox && currentImage}
	<div class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" on:click={closeLightbox} on:keydown={handleKeydown} tabindex="0">
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
</style>