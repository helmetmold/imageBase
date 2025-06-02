<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { writable } from 'svelte/store';
	import { createClient } from '@supabase/supabase-js';
	import BunnyVideo from '$lib/components/BunnyVideo.svelte';
	import BunnyMusic from '$lib/components/BunnyMusic.svelte';
	import  animIcon  from '$lib/siteImages/Cartoon_Icon.webp';
	import  VFXIcon  from '$lib/siteImages/VFX_Icon.webp';
	import  YTGameIcon from '$lib/siteImages/Gamer_Icon.webp';
	import  logo  from '$lib/siteImages/Logo icon.png';
	import { page } from '$app/stores';
	import { Menu } from '@lucide/svelte';
	import { browser } from '$app/environment';

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

	// Add this interface for music items
	interface MusicItem {
		name: string;
		guid: string;
		title: string;
		duration: number;
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
	let isMusicCollapsed = true;
	let isSoundEffectsCollapsed = true;

	// Initialize Supabase client
	const supabaseUrl = 'https://kfeprdcotfmvpfkjdthc.supabase.co';
	const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmZXByZGNvdGZtdnBma2pkdGhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE2NzM5ODMsImV4cCI6MjA0NzI0OTk4M30.BH5shEVUATHZbep-cXYlHY8FtRt-VROlP6A1-BOi5es'; // Replace with your Supabase anon key
	const supabase = createClient(supabaseUrl, supabaseAnonKey);

	let collections: Collection[] = [];
	let mainVideoID = ''; // Set this to the ID of the main video if needed
	let collectionNames: string[] = [];
	let musicCollectionNames: string[] = [];
	let musicCollection: Collection[] = [];
	let selectedCollection: Collection | null = null; // Track the selected collection

	// Add this to your script section
	let selectedMusic: MusicItem[] = [];

	// Add this new state variable
	let isSidebarOpen = false;

	// Add this new state variable
	let isScrolled = false;

	// Add this new state variable
	let showWelcome = true;

	// Add this function to handle scroll events
	function handleScroll() {
		isScrolled = window.scrollY > 0;
	}

	// Add this function to handle sidebar toggle
	function toggleSidebar() {
		isSidebarOpen = !isSidebarOpen;
	}

	// Add this function to handle URL parameters
	function handleCategoryFromUrl() {
		const category = $page.url.searchParams.get('category');
		if (category) {
			if (categories.includes(category)) {
				selectCategory(category);
			} else if (collectionNames.includes(category)) {
				handleVideoCategory(category);
			} else if (musicCollectionNames.includes(category)) {
				handleMusicCategory(category);
			}
		}
	}

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

			// Fetch music collections from Bunny.net
			const musicResponse = await fetch('https://video.bunnycdn.com/library/407063/collections', {
				method: 'GET',
				headers: {
					'AccessKey': 'ced85872-de7f-47ff-bd0298d097e0-cb07-41e3'
				}
			});

			if (!musicResponse.ok) throw new Error('Failed to fetch music collections');

			const musicCollectionsData = await musicResponse.json();
			console.log('Music Collections Data:', musicCollectionsData);

			if (musicCollectionsData && Array.isArray(musicCollectionsData.items)) {
				musicCollectionNames = musicCollectionsData.items.map((collection: Collection) => collection.name);
				musicCollection = musicCollectionsData.items;
			}
		} catch (error) {
			console.error('Error loading collections:', error);
			collectionNames = [];
			musicCollectionNames = [];
		}

		// Call this when the component mounts
		handleCategoryFromUrl();

		// Initialize scroll state only in browser
		if (browser) {
			handleScroll();
			// Add scroll event listener
			window.addEventListener('scroll', handleScroll);
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
		showWelcome = false; // Hide welcome page when category is selected
		toggleSidebar(); // Close the sidebar when a category is selected
		history.pushState(null, '', `?category=${category}`); // Update the URL without reloading the page
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
			isMusicCollapsed = true;
			isSoundEffectsCollapsed = true;
		} else if (section === 'videos') {
			isVideosCollapsed = !isVideosCollapsed;
			isImagesCollapsed = true;
			isMusicCollapsed = true;
			isSoundEffectsCollapsed = true;
		} else if (section === 'music') {
			isMusicCollapsed = !isMusicCollapsed;
			isImagesCollapsed = true;
			isVideosCollapsed = true;
			isSoundEffectsCollapsed = true;
		} else if (section === 'soundEffects') {
			isSoundEffectsCollapsed = !isSoundEffectsCollapsed;
			isImagesCollapsed = true;
			isVideosCollapsed = true;
			isMusicCollapsed = true;
		}
	}

	async function handleVideoCategory(collectionName: string) {
		var collection = collections.find((c: Collection) => c.name === collectionName);

		if (!collection)
		{
			return;
		}

		showWelcome = false; // Hide welcome page when video category is selected
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
			toggleSidebar(); // Close the sidebar when a video category is selected
			history.pushState(null, '', `?category=${collectionName}`); // Update the URL without reloading the page
		} catch (error) {
			console.error('Error loading videos:', error);
			selectedCollection = null;
		} finally {
			isVideoLoading = false; // Reset video loading state
		}
	}

	async function handleMusicCategory(collectionName: string) {
		var collection = musicCollection.find((c: Collection) => c.name === collectionName);

		if (!collection)
		{
			return;
		}

		showWelcome = false; // Hide welcome page when music category is selected
		isVideoLoading = true; // Set video loading state to true

		try {
			// Fetch videos for the selected collection
			const response = await fetch(`https://video.bunnycdn.com/library/${collection.videoLibraryId}/videos?collection=${collection.guid}`, {
				method: 'GET',
				headers: {
					'AccessKey': 'ced85872-de7f-47ff-bd0298d097e0-cb07-41e3'
				}
			});

			if (!response.ok) throw new Error('Failed to fetch videos');

			const videosData = await response.json();
			console.log('Music Videos Data:', videosData);

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
			toggleSidebar(); // Close the sidebar when a music category is selected
			history.pushState(null, '', `?category=${collectionName}`); // Update the URL without reloading the page
		} catch (error) {
			console.error('Error loading videos:', error);
			selectedCollection = null;
		} finally {
			isVideoLoading = false; // Reset video loading state
		}
	}

	function getCategoryEmoji(category: string) {
		const emojiMap = {
			// Images
			'nature': '🌿',
			'animals': '🐾',
			'people': '👥',
			'food': '🍽️',
			'travel': '✈️',
			'business': '💼',
			'technology': '💻',
			'sports': '⚽',
			'entertainment': '🎭',
			'abstract': '🎨',
			
			// Videos
			'tutorials': '📚',
			'music': '🎵',
			'gaming': '🎮',
			'vlog': '📹',
			'animation': '🎬',
			'documentary': '🎥',
			'education': '📖',
			
			// New Categories
			'avatars': '👤',
			'effects': '✨',
			'explosions': '💥',
			'face cam overlays': '📸',
			'logos': '🎨',
			'minecraft': '⛏️',
			'roblox': '🎮',
			'youtubers': '📺',
			'backdrops': '🖼️',
			'lightning': '⚡',
			'smoke': '💨',
			'scene replication': '🎬',
			'space': '🚀',
			'doors': '🚪',
			'hands': '✋',
			'emoji': '😀',
			'spongebob': '🧽',
			'fire': '🔥',
			'countdown': '⏰',
			'minions': '👁️',
			'screens': '📺',
			'among us': '🔴',
			'news broadcast': '📰',
			'memes': '😂',
			'super powers': '⚡',
			'anime': '🎌',
			'special effects editors': '✨',
			'first person': '👁️',
			'weather': '🌤️',
			
			// Music
			'background': '🎼',
			'soundtracks': '🎵',
			
			// Sound Effects
			'ambient': '🌊',
			'foley': '👂',
			'ui': '🔊'
		};

		// Try to find an exact match
		if (category.toLowerCase() in emojiMap) {
			return emojiMap[category.toLowerCase() as keyof typeof emojiMap];
		}

		// Try to find a partial match
		const categoryLower = category.toLowerCase();
		for (const [key, emoji] of Object.entries(emojiMap)) {
			if (categoryLower.includes(key) || key.includes(categoryLower)) {
				return emoji;
			}
		}

		// Default emoji if no match found
		return '📁';
	}
</script>

<section class="flex h-screen">
	<!-- Mobile Menu Button -->
	<button 
		class="fixed top-2 left-4 z-50 md:hidden p-2 rounded-md transition-colors duration-200 {isScrolled ? 'bg-black/80' : ''}"
		on:click={toggleSidebar}
	>	
		<Menu class="w-12 h-12 text-white" />
		
	</button>

	<!-- Sidebar for Category Filter -->
	<div class="w-64 bg-[#181818] text-white px-4 pt-12 fixed md:relative h-full transition-transform duration-300 ease-in-out transform {isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 z-40">
		<div class="flex flex-col h-full overflow-y-auto">
			<div class="flex gap-2 my-2 border-b mt-6 sm:mt-0 border-gray-700 pb-2">
				<img src={logo} alt="Logo" class="w-7 h-7 object-contain">
				<h2 class="text-base mb-4 my-auto">Creator Vault</h2>
			</div>
			<div class="flex flex-col">
				<div class="Images">
					<button class="w-full flex justify-between items-center py-5 text-white" on:click={() => toggleCollapse('images')}>
						<div class="flex items-center gap-2">
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
								<path fill-rule="evenodd" d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z" clip-rule="evenodd" />
							</svg>
							<span class="text-sm">Images</span>
						</div>
						
						<span class="transition-transform duration-300" style="transform: rotate({isImagesCollapsed ? 180 : 0}deg);">
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="w-4 h-4">
								<path fill-rule="evenodd" d="M11.78 9.78a.75.75 0 0 1-1.06 0L8 7.06 5.28 9.78a.75.75 0 0 1-1.06-1.06l3.25-3.25a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06Z" clip-rule="evenodd" />
							</svg>
						</span>
					</button>
					<div class="overflow-hidden transition-all duration-300 ease-in-out" style="max-height: {isImagesCollapsed ? '0' : '1000px'};">
						<div class="flex flex-col border-l border-gray-700 ml-6 pl-4">
							{#each categories as category}
								<button
									type="button"
									class="px-2 py-1 text-left font-medium text-sm text-white hover:bg-[#28B9EB] rounded-md transition-colors {selectedCategory === category ? 'bg-[#28B9EB]' : ''}"
									on:click={() => {
										selectCategory(category);
										toggleSidebar();
										// Update URL without page reload
										history.pushState({}, '', `?category=${category}`);
									}}
								>
									<span class="flex items-center gap-2 justify-between">
										<span class="capitalize">{category}</span>
										<span class="text-base">{getCategoryEmoji(category)}</span>
										
									</span>
								</button>
							{/each}
						</div>
					</div>
				</div>
				<div class="Videos mb-6">
					<button class="w-full flex justify-between items-center py-5 text-white" on:click={() => toggleCollapse('videos')}>
						<div class="flex items-center gap-2">
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
								<path d="M4.5 4.5a3 3 0 00-3 3v9a3 3 0 003 3h8.25a3 3 0 003-3v-9a3 3 0 00-3-3H4.5zM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.945 2.56-.276 2.56 1.06v11.38c0 1.336-1.616 2.005-2.56 1.06z" />
							</svg>
							<span class="text-sm">Videos</span>
						</div>
						<span class="transition-transform duration-300" style="transform: rotate({isVideosCollapsed ? 180 : 0}deg);">
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="w-4 h-4">
								<path fill-rule="evenodd" d="M11.78 9.78a.75.75 0 0 1-1.06 0L8 7.06 5.28 9.78a.75.75 0 0 1-1.06-1.06l3.25-3.25a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06Z" clip-rule="evenodd" />
							</svg>
						</span>
					</button>
					<div class="overflow-hidden transition-all duration-300 ease-in-out" style="max-height: {isVideosCollapsed ? '0' : '1000px'};">
						<div class="flex flex-col border-l border-gray-700 ml-6 pl-4 ">
							{#each collectionNames as collectionName}
								<button 
									type="button" 
									class="px-2 py-1 text-left font-medium text-sm text-white hover:bg-[#28B9EB] rounded-md transition-colors {selectedCategory === collectionName ? 'bg-[#28B9EB]' : ''}"
									on:click={() => {
										handleVideoCategory(collectionName);
										toggleSidebar();
										// Update URL without page reload
										history.pushState({}, '', `?category=${collectionName}`);
									}}
								>
									<span class="flex items-center gap-2 justify-between">
										<span class="capitalize">{collectionName}</span>
										<span class="text-base">{getCategoryEmoji(collectionName)}</span>
									</span>
								</button>
							{/each}
						</div>
					</div>
				</div>
				<!--
				<div class="Music">
					<button class="w-full flex justify-between items-center py-5 text-white" on:click={() => toggleCollapse('music')}>
						<div class="flex items-center gap-2">
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
								<path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
							</svg>
							<span class="text-sm">Music</span>
						</div>
						<span class="transition-transform duration-300" style="transform: rotate({isMusicCollapsed ? 180 : 0}deg);">
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="w-4 h-4">
								<path fill-rule="evenodd" d="M11.78 9.78a.75.75 0 0 1-1.06 0L8 7.06 5.28 9.78a.75.75 0 0 1-1.06-1.06l3.25-3.25a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06Z" clip-rule="evenodd" />
							</svg>
						</span>
					</button>
					<div class="overflow-hidden transition-all duration-300 ease-in-out" style="max-height: {isMusicCollapsed ? '0' : '1000px'};">
						<div class="flex flex-col border-l border-gray-700 ml-6 pl-4">
							{#each musicCollectionNames as collectionName}
								<button 
									type="button" 
									class="px-2 py-1 text-left font-medium text-sm text-white hover:bg-[#28B9EB] rounded-md transition-colors {selectedCategory === collectionName ? 'bg-[#28B9EB]' : ''}"
									on:click={() => {
										handleMusicCategory(collectionName);
										toggleSidebar();
										// Update URL without page reload
										history.pushState({}, '', `?category=${collectionName}`);
									}}
								>
									<span class="flex items-center gap-2 justify-between">
										<span class="capitalize">{collectionName}</span>
										<span class="text-base">{getCategoryEmoji(collectionName)}</span>
									</span>
								</button>
							{/each}
						</div>
					</div>
				</div>
				-->
				<!-- Remove or comment out the entire Sound Effects section -->
				<!--
				<div class="SoundEffects">
					<button class="w-full flex justify-between items-center py-5 text-white" on:click={() => toggleCollapse('soundEffects')}>
						<div class="flex items-center gap-2">
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
								<path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
							</svg>
							<span class="text-sm">Sound Effects</span>
						</div>
						<span class="transition-transform duration-300" style="transform: rotate({isSoundEffectsCollapsed ? 180 : 0}deg);">
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="w-4 h-4">
								<path fill-rule="evenodd" d="M11.78 9.78a.75.75 0 0 1-1.06 0L8 7.06 5.28 9.78a.75.75 0 0 1-1.06-1.06l3.25-3.25a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06Z" clip-rule="evenodd" />
							</svg>
						</span>
					</button>
					<div class="overflow-hidden transition-all duration-300 ease-in-out" style="max-height: {isSoundEffectsCollapsed ? '0' : '1000px'};">
						<div class="flex flex-col border-l border-gray-700 ml-6 pl-4">
							<button type="button" class="px-2 py-1 text-left font-medium text-sm text-white hover:bg-[#28B9EB] rounded-md transition-colors">
								<span class="flex items-center gap-2 justify-between">
									<span>Ambient</span>
									<span class="text-base">🌊</span>
								</span>
							</button>
							<button type="button" class="px-2 py-1 text-left font-medium text-sm text-white hover:bg-[#28B9EB] rounded-md transition-colors">
								<span class="flex items-center gap-2 justify-between">
									<span>Foley</span>
									<span class="text-base">👂</span>
								</span>
							</button>
							<button type="button" class="px-2 py-1 text-left font-medium text-sm text-white hover:bg-[#28B9EB] rounded-md transition-colors">
								<span class="flex items-center gap-2 justify-between">
									<span>UI Sounds</span>
									<span class="text-base">🔊</span>
								</span>
							</button>
						</div>
					</div>
				</div>
				-->
			</div>
			<div class="flex flex-col gap-4 mt-auto pb-6">
				<div class="">
					<a 
						class="w-full flex justify-between items-center text-white bg-[#333333] rounded-md p-3" 
						href="/2D-cartoon-animators"
					>
						<div class="flex items-center gap-2">
							<img src={animIcon} alt="2D Cartoon Animators" class="w-6 h-6">
							<span class="text-sm">2D Cartoon Animators</span>
						</div>
						<span class="transition-transform duration-300">
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
								<path fill-rule="evenodd" d="M12.97 3.97a.75.75 0 011.06 0l7.5 7.5a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 11-1.06-1.06l6.22-6.22-6.22-6.22a.75.75 0 010-1.06z" clip-rule="evenodd" />
							</svg>
						</span>
					</a>
				</div>
				<div class="">
					<a
						class="w-full flex justify-between items-center text-white bg-[#333333] rounded-md p-3" 
						href="/special-effects"
					>
						<div class="flex items-center gap-2 ">
							<img src={VFXIcon} alt="Special Effects" class="w-6 h-6">
							<span class="text-sm">Special Effects</span>
						</div>
						<span class="transition-transform duration-300">
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
								<path fill-rule="evenodd" d="M12.97 3.97a.75.75 0 011.06 0l7.5 7.5a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 11-1.06-1.06l6.22-6.22-6.22-6.22a.75.75 0 010-1.06z" clip-rule="evenodd" />
							</svg>
						</span>
					</a>
				</div>
			</div>
		</div>
		

	</div>

	<!-- Overlay for mobile -->
	{#if isSidebarOpen}
		<div 
			class="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
			on:click={toggleSidebar}
		></div>
	{/if}

	<!-- Main Content -->
	<div class="flex-1 px-6 h-screen overflow-y-scroll">
		{#if isLoading || isVideoLoading}
			<!-- Loading Indicator -->
			<div class="flex justify-center items-center h-64">
				<div class="loader"></div>
			</div>
		{:else if showWelcome}
			<!-- Welcome Page -->
			<div class="flex flex-col items-center justify-center h-full text-center text-white">
				<h1 class="text-4xl font-bold mb-4">🔥Creator Vault🔥</h1>
				<p class="text-lg text-gray-300">
					👈 Select a category
				</p>
			</div>
		{:else if selectedCollection}
			<!-- Video/Music Gallery -->
			<div class="flex flex-col gap-6">
				<div class="mt-12">
					<h2 class="text-5xl mt-24 sm:mt-0 font-bold mb-4 text-white capitalize">{selectedCollection.name}</h2>
				</div>
				<div class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
					{#each selectedCollection.items as item}
						{#if musicCollectionNames.includes(selectedCollection.name)}
						<div class="grid grid-cols-1">
							<BunnyMusic
								videoID={item.guid}
								videoName={item.name}
							/>
						</div>
						{:else}
						
							<BunnyVideo
								videoID={item.guid}
								{handleThumbnailClick}
								{mainVideoID}
							/>
						
						{/if}
					{/each}
				</div>
				</div>
		{:else}
			<!-- Image Tiles -->
			<div class="mt-12 pb-6">
				<h2 class="text-5xl mt-24 sm:mt-0 font-bold mb-4 text-white capitalize">{selectedCategory}</h2>
			</div>
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
		overflow-y: auto; /* Enable vertical scrolling */
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

	/* Add this to handle body scroll when sidebar is open */
	:global(body) {
		overflow: var(--body-overflow, auto);
	}
</style>