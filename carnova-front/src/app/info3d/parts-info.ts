export interface PartInfo {
  id: string;
  title: string;
  details: string[];
}

export const PARTS: Record<string, PartInfo> = {
  Engine:  { id: 'Engine',  title: 'Moteur',  details: ['Turbo 1.2 bar', 'Alternateur 120A', 'Vidange 10 000 km'] },
  Hood:    { id: 'Hood',    title: 'Capot',   details: ['Matériau: Alu/Acier', 'Ouverture ≈ 55°'] },
  Trunk:   { id: 'Trunk',   title: 'Coffre',  details: ['Volume indicatif ~ 450–550 L'] },
  Door_FL: { id: 'Door_FL', title: 'Porte AVG', details: ['Airbags latéraux', 'Commande vitres'] },
  Door_FR: { id: 'Door_FR', title: 'Porte AVD', details: ['Airbags latéraux'] },
  Interior:{ id: 'Interior',title: 'Intérieur', details: ['Sièges tissu/cuir', 'Écran central', 'Clim auto'] }
};
