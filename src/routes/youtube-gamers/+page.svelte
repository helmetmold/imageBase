<script lang="ts">
    import { ArrowLeft, ExternalLink } from '@lucide/svelte';
    import TierList from '$lib/siteImages/Tier list.png';
    import WavyBackground from '$lib/components/wavyBackground.svelte';
    import Meteors from '$lib/components/meteors.svelte';
    import Backgroundbeams from '$lib/components/Backgroundbeams.svelte';
    import Logos from '$lib/siteImages/Small_Preview_Free_Gaming_Logos_Templates.jpg';
</script>

<!-- Background layer -->
<div class="fixed inset-0 z-0">
    <Backgroundbeams color="#F43B3B" />
</div>

<!-- Content layer -->
<div class="relative z-10 flex flex-col gap-12 mt-12">
    <div class="flex flex-col gap-12">
        <div class="flex flex-col gap-12 px-6">
            <div class="z-10 flex flex-col gap-12">
                <a href="/" class="text-white hover:text-gray-300 flex flex-row gap-2 items-center">
                    <ArrowLeft class="w-6 h-6" />
                    Back
                </a>
                <h2 class="inter-var text-4xl font-bold text-white">
                    YouTube Gamers
                </h2>
            </div>
            
    
            <div class="flex flex-col gap-4 z-10">
                <h3 class="text-3xl font-bold text-white capitalize">Logos</h3>
                <div class="flex flex-row gap-4">
                    <a href="/tier-list">
                        <img src={Logos} alt="Tier List" class="object-contain rounded-md max-w-[500px]">
                    </a>    
                    
                    <div class="flex flex-col gap-4">
                        <a href="/tier-list" class="bg-[#28B9EB] text-white font-bold px-4 py-2 my-auto rounded-md flex flex-row gap-2 items-center">
                            Logos
                            <ExternalLink class="w-4 h-4" />
                        </a>
                    </div>
                    
                </div>
            </div>
            <div class="flex flex-col gap-4 z-10">
                <h3 class="text-3xl font-bold text-white capitalize">Tier List</h3>
                <div class="flex flex-row gap-4">
                    <a href="/tier-list">
                        <img src={TierList} alt="Tier List" class="object-contain rounded-md max-w-[500px]">
                    </a>    
                    
                    <div class="flex flex-col gap-4">
                        <a href="/tier-list" class="bg-[#28B9EB] text-white font-bold px-4 py-2 my-auto rounded-md flex flex-row gap-2 items-center">
                            Tier List
                            <ExternalLink class="w-4 h-4" />
                        </a>
                    </div>
                    
                </div>
            </div>
        </div>
    </div>
</div>