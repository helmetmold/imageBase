import { writable } from 'svelte/store';

export const currentlyPlayingStore = writable<string[]>([]);