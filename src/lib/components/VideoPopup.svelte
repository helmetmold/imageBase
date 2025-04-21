<script lang="ts">
	import { X } from '@lucide/svelte';
	
	export let videoID: string;
	export let isOpen: boolean;
	export let onClose: () => void;

	async function handleDownload(videoId: string, videoTitle: string) {
        const response = await fetch(
            `https://vz-0ec947d1-b25.b-cdn.net/${videoId}/play_720p.mp4`
        );
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        const videoName = String(videoTitle).trim() ?? 'video';
        link.href = url;
        link.download = `${videoName}.mp4`; // Specify the desired file name
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }
</script>

{#if isOpen}
	<div 
		class="fixed inset-0 bg-black/80 z-50 items-center justify-center flex flex-col gap-6 p-12"  
		on:click={onClose}
		on:keydown={e => e.key === 'Escape' && onClose()}
		role="button"
		tabindex="0"
	>
		<div 
			class="relative w-full max-w-4xl mx-4 bg-neutral-900 rounded-lg overflow-hidden" 
			on:click|stopPropagation
			on:keydown|stopPropagation
			role="button"
			tabindex="0"
		>
			<div style="position:relative;padding-top:56.25%;">
				<iframe 
					title="Video Player"
					class="z-50" 
					src={`https://iframe.mediadelivery.net/embed/402442/${videoID}?autoplay=false&loop=false&muted=false&preload=false&responsive=true`}
					loading="lazy" 
					style="border:0;position:absolute;top:0;height:100%;width:100%;" 
					allow="accelerometer;gyroscope;encrypted-media;picture-in-picture;" 
				></iframe>
			</div>
			<!-- Add a download button below the video -->
			
		</div>
		<div class="mt-4 text-center mb-6">
			<button 
				on:click={() => handleDownload(videoID, 'Video')}
				class="bg-[#28B9EB] hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
			>
				Download Video
			</button>
		</div>
	</div>
{/if}
