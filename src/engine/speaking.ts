/**
 * Qui parle dans la boîte de dialogue : id du personnage à l'écran et si sa
 * bouche bouge (frappe en cours). Écrit par ui/DialogueBox, lu par les
 * billboards animés des pièces (three/props.ts `actorFrame`) pour jouer leur
 * frame « parle » en même temps que le portrait.
 */
export const speaking: { id: string | null; talking: boolean } = { id: null, talking: false };
