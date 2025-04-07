<script lang="ts">
	import { writable } from 'svelte/store';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	type TierItem = { src: string; name: string };
	let uploadedImages: { src: string; name: string }[] = [];
	let tiers = writable<{ name: string; color: string; items: TierItem[] }[]>([
		{ name: 'S', color: '#00FF00', items: [] },
		{ name: 'A', color: '#7FFF00', items: [] },
		{ name: 'B', color: '#FFFF00', items: [] },
		{ name: 'C', color: '#FFBF00', items: [] },
		{ name: 'D', color: '#FF8000', items: [] },
		{ name: 'E', color: '#FF4000', items: [] },
		{ name: 'F', color: '#FF0000', items: [] }
	]);

	const isDragging = writable(false);
	let touchStartX: number | null = null;
	let touchStartY: number | null = null;
	let draggedImage: { src: string; name: string } | null = null;
	let draggedSource: string | null = null;
	let draggedIndex: number | null = null;
	let draggedSourceTierIndex: number | null = null;
	let dragImageElement: HTMLImageElement | null = null;
	let isOverBin = false;

	onMount(() => {
		if (browser) {
			uploadedImages = JSON.parse(localStorage.getItem('uploadedImages') || '[]');
			tiers.set(JSON.parse(localStorage.getItem('tiers') || JSON.stringify($tiers)));
		}
	});

	$: if (browser) {
		localStorage.setItem('uploadedImages', JSON.stringify(uploadedImages));
		localStorage.setItem('tiers', JSON.stringify($tiers));
	}

	function handleFileUpload(event: Event) {
		const files = (event.target as HTMLInputElement).files;
		if (files) {
			for (const file of files) {
				const reader = new FileReader();
				reader.onload = (e) => {
					uploadedImages = [...uploadedImages, { src: e.target?.result as string, name: file.name }];
				};
				reader.readAsDataURL(file);
			}
		}
	}

	function handleDragStart(event: DragEvent, image: { src: string; name: string }, source: string, index: number, sourceTierIndex?: number) {
		event.dataTransfer?.setData('text/plain', JSON.stringify({ image, source, index }));
		isDragging.set(true);
		draggedSourceTierIndex = sourceTierIndex ?? null;
	}

	function handleTouchStart(event: TouchEvent, image: { src: string; name: string }, source: string, index: number, sourceTierIndex?: number) {
		const touch = event.touches[0];
		touchStartX = touch.clientX;
		touchStartY = touch.clientY;
		draggedImage = image;
		draggedSource = source;
		draggedIndex = index;
		draggedSourceTierIndex = sourceTierIndex ?? null;
		isDragging.set(true);

		const imgElement = event.target as HTMLImageElement;
		imgElement.setAttribute('dragging', 'true');
		imgElement.style.position = 'fixed';
		imgElement.style.zIndex = '1000';
		imgElement.style.pointerEvents = 'none';
		updateDragImagePosition(touch.clientX, touch.clientY, imgElement);
	}

	function handleTouchMove(event: TouchEvent) {
		if (touchStartX !== null && touchStartY !== null) {
			const touch = event.touches[0];
			const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);
			isOverBin = dropTarget?.closest('.delete-bin') !== null;
			
			const deltaX = touch.clientX - touchStartX;
			const deltaY = touch.clientY - touchStartY;
			if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
				event.preventDefault();
				const imgElement = event.target as HTMLImageElement;
				updateDragImagePosition(touch.clientX, touch.clientY, imgElement);
			}
		}
	}

	function handleTouchEnd(event: TouchEvent) {
		if (draggedImage && draggedSource !== null && draggedIndex !== null) {
			const touch = event.changedTouches[0];
			const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);
			console.log(dropTarget);
			if (dropTarget?.classList.contains('delete-bin')) {
				handleBinDrop();
			} else if (dropTarget?.classList.contains('tier')) {
				console.log("tier");

				const tierIndex = parseInt(dropTarget.getAttribute('data-index') || '-1', 10);
				console.log(tierIndex);
				if (tierIndex >= 0) {
					handleDrop(tierIndex);
				}
				if (tierIndex <= 0) {
					const parentTier = dropTarget?.closest('[data-index]');
					if (parentTier) {
						const parentTierIndex = parseInt(parentTier.getAttribute('data-index') || '-1', 10);
						if (parentTierIndex >= 0) {
							handleDrop(parentTierIndex);
						}
					}
				}
			} else if (dropTarget?.classList.contains('uploaded-images')) {
				handleDrop(null);
				
			}
		}
		resetDragState();
	}

	function updateDragImagePosition(x: number, y: number, element: HTMLElement) {
		element.style.left = `${x}px`;
		element.style.top = `${y}px`;
		element.style.transform = 'translate(-50%, -50%)';
	}

	function handleDrop(tierIndex: number | null) {
		if (draggedImage && draggedSource !== null && draggedIndex !== null) {
			// First remove from source
			if (draggedSource === 'uploaded') {
				uploadedImages = uploadedImages.filter((_, i) => i !== draggedIndex);
			} else if (draggedSource === 'tier' && draggedSourceTierIndex !== null) {
				tiers.update((t) => {
					const newTiers = [...t];
					newTiers[draggedSourceTierIndex as number].items = newTiers[draggedSourceTierIndex as number].items.filter((_, i) => i !== draggedIndex);
					return newTiers;
				});
			}

			// Then add to destination
			if (tierIndex !== null) {
				tiers.update((t) => {
					const newTiers = [...t];
					if (draggedImage) {
						newTiers[tierIndex].items = [...newTiers[tierIndex].items, draggedImage];
					}
					return newTiers;
				});
			} else {
				uploadedImages = [...uploadedImages, draggedImage];
				console.log("return");
			}

			
		}
		resetDragState();
	}

	function handleBinDrop() {
		if (draggedImage && draggedSource !== null && draggedIndex !== null) {
			if (draggedSource === 'uploaded') {
				uploadedImages = uploadedImages.filter((_, i) => i !== draggedIndex);
			} else if (draggedSource === 'tier' && draggedSourceTierIndex !== null) {
				tiers.update((t) => {
					const newTiers = [...t];
					newTiers[draggedSourceTierIndex as number].items = newTiers[draggedSourceTierIndex as number].items.filter((_, i) => i !== draggedIndex);
					return newTiers;
				});
			}
		}
		resetDragState();
	}

	function resetDragState() {
		isDragging.set(false);
		isOverBin = false;
		touchStartX = null;
		touchStartY = null;
		draggedImage = null;
		draggedSource = null;
		draggedIndex = null;
		draggedSourceTierIndex = null;
		
		// Reset any dragged image elements
		document.querySelectorAll('img[dragging="true"]').forEach(img => {
			const imageElement = img as HTMLElement;
			imageElement.removeAttribute('dragging');
			imageElement.style.position = '';
			imageElement.style.left = '';
			imageElement.style.top = '';
			imageElement.style.transform = '';
			imageElement.style.zIndex = '';
			imageElement.style.pointerEvents = '';
		});
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
	}

	function handleDragEnd() {
		isDragging.set(false);
	}
</script>



<div class="flex flex-col gap-5 p-8">
	{#each $tiers as tier, index}
		<div class="flex items-center tier z-100 rounded-lg overflow-hidden" data-index={index} on:drop={() => handleDrop(index)} on:dragover={handleDragOver}>
			<div class="flex gap-2.5 flex-grow tier">

				<div class="flex gap-2.5 flex-grow flex-row tier bg-neutral-800">
					<div class="w-12 h-full min-h-12 flex items-center justify-center text-2xl font-bold text-black mr-2.5" style="background-color: {tier.color}">
						{tier.name}
					</div>
					{#each tier.items as item, itemIndex}
					<div class="relative ">
						<img 
							src={item.src} 
							alt={item.name} 
							class="w-24 h-24 object-cover cursor-pointer" 
							draggable="true" 
							on:dragstart={(event) => handleDragStart(event, item, 'tier', itemIndex, index)} 
							on:dragend={handleDragEnd} 
							on:touchstart={(event) => handleTouchStart(event, item, 'tier', itemIndex, index)} 
							on:touchmove={handleTouchMove} 
							on:touchend={handleTouchEnd} 
						/>
					</div>
				{/each}
				</div>
			</div>
		</div>
	{/each}
	<div class="">
		<h2 class="text-xl font-semibold mb-3">Upload Your Images</h2>
		<label class="inline-flex items-center px-4 py-2 bg-[#28B9EB] hover:bg-[#219EC9] text-white rounded-full cursor-pointer transition-colors duration-200">
			<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
			</svg>
			Choose Files
			<input type="file" accept="image/*" multiple on:change={handleFileUpload} class="hidden" />
		</label>
	</div>
	<div class=" uploaded-images" on:drop={() => handleDrop(null)} on:dragover={handleDragOver}>
		<h2 class="text-xl font-semibold mb-3">Uploaded Images</h2>
		<div class="flex flex-wrap gap-2.5">
			{#each uploadedImages as image, index}
				<div class="relative">
					<img src={image.src} alt={image.name} class="w-24 h-24 object-cover cursor-pointer" draggable="true" on:dragstart={(event) => handleDragStart(event, image, 'uploaded', index)} on:dragend={handleDragEnd} on:touchstart={(event) => handleTouchStart(event, image, 'uploaded', index)} on:touchmove={handleTouchMove} on:touchend={handleTouchEnd} />
				</div>
			{/each}
		</div>
	</div>
	{#if $isDragging}
	<div class=" p-5 border-2 border-dashed text-center transition-colors duration-200 {isOverBin ? 'border-red-500 bg-red-100 text-red-500' : 'border-gray-300 text-gray-500'} delete-bin" on:drop={handleBinDrop} on:dragover={handleDragOver}>
		<p>Drag here to delete</p>
	</div>
{/if}
</div>







<style>
	.drag-image {
		position: absolute;
		width: 100px;
		height: 100px;
		object-fit: cover;
		pointer-events: none;
		transform: translate(-50%, -50%);
		z-index: 1000;
	}
</style> 