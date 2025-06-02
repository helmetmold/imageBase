<script lang="ts">
    import { ArrowLeft, ExternalLink, Download } from '@lucide/svelte';
    import TierList from '$lib/siteImages/Tier list.png';
    import WavyBackground from '$lib/components/wavyBackground.svelte';
    import Meteors from '$lib/components/meteors.svelte';
    import Backgroundbeams from '$lib/components/Backgroundbeams.svelte';
    import Logos from '$lib/siteImages/Small_Preview_Free_Gaming_Logos_Templates.jpg';

    // Add download function
    async function handleDownload(videoId: string, videoTitle: string) {
        try {
            const response = await fetch(
                `https://vz-0ec947d1-b25.b-cdn.net/${videoId}/play_720p.mp4`
            );
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            const videoName = String(videoTitle).trim() ?? 'video';
            link.href = url;
            link.download = `${videoName}.mp4`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed:', error);
        }
    }
</script>

<!-- Background layer -->
<div class="fixed inset-0 z-0">
    <Backgroundbeams color="#28B9EB" />
</div>

<!-- Content layer -->
<div class="relative z-10 flex flex-col gap-12 mt-12">
    <div class="flex flex-col gap-12">
        <div class="flex flex-col gap-12 px-6 pb-12">
            <div class="z-10 flex flex-col gap-12">
                <a href="/" class="text-white hover:text-gray-300 flex flex-row gap-2 items-center">
                    <ArrowLeft class="w-6 h-6" />
                    Back
                </a>
            </div>
            <h2 class="inter-var text-4xl font-bold text-white">
                Special Effects
            </h2>
            <div class="flex flex-col gap-4 z-10">
                <h3 class="text-3xl font-bold text-white capitalize">Explosions</h3>
            </div>

            <div class="flex flex-col gap-4 z-10">
                <div class="flex flex-row gap-12">
                    <div class="flex flex-col gap-4">
                        <a 
                            href="/?category=Explosions"
                            class="bg-[#28B9EB] text-white font-bold px-4 py-2 my-auto rounded-md flex flex-row gap-2 items-center hover:bg-[#1a9bc7] transition-colors"
                        >
                            See Explosions
                            <ExternalLink class="w-4 h-4" />
                        </a>
                    </div>
                </div>
            </div>
            <h3 class="text-3xl font-bold text-white capitalize">Teleportation</h3>
            <div class="flex flex-col gap-4 z-10">
                
                <div class="flex flex-row gap-12">
                    <div class="flex flex-col gap-4">
                        <a 
                            href="/?category=smoke"
                            class="bg-[#28B9EB] text-white font-bold px-4 py-2 my-auto rounded-md flex flex-row gap-2 items-center hover:bg-[#1a9bc7] transition-colors"
                        >
                            See Smoke
                            <ExternalLink class="w-4 h-4" />
                        </a>
                    </div>
                    
                </div>
            </div>
            <h3 class="text-3xl font-bold text-white capitalize">Fire</h3>
            <div class="flex flex-col gap-4 z-10">
                <div class="flex flex-row gap-12">
                    <div class="flex flex-col gap-4">
                        <a 
                        href="/?category=Fire"
                        class="bg-[#28B9EB] text-white font-bold px-4 py-2 my-auto rounded-md flex flex-row gap-2 items-center hover:bg-[#1a9bc7] transition-colors"
                    >
                        See Fire
                        <ExternalLink class="w-4 h-4" />
                    </a>
                    </div>
                </div>
            </div>
            <h3 class="text-3xl font-bold text-white capitalize">Green Screen Backgrounds</h3>
            <div class="flex flex-col gap-4 z-10">
                <div class="flex flex-row gap-12">
                    <div class="flex flex-col gap-4">
                        <a 
                        href="/?category=Backdrops"
                        class="bg-[#28B9EB] text-white font-bold px-4 py-2 my-auto rounded-md flex flex-row gap-2 items-center hover:bg-[#1a9bc7] transition-colors"
                    >
                        See Green Screen Backgrounds
                        <ExternalLink class="w-4 h-4" />
                    </a>
                    </div>
                </div>
            </div>

                
        </div>
    </div>
</div>