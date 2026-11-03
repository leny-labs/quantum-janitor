/**
 * Qui parle dans la boîte de dialogue : id du personnage à l'écran et si sa
 * bouche bouge (frappe en cours). Écrit par ui/DialogueBox, lu par les
 * billboards animés des pièces (three/props.ts `actorFrame`) pour jouer leur
 * frame « parle » en même temps que le portrait. `open` : boîte de dialogue
 * affichée (les plans de fin se recadrent au-dessus du panneau).
 */
export const speaking: { id: string | null; talking: boolean; open: boolean } = { id: null, talking: false, open: false };
