export type HealthStatus = 'disponible' | 'duda' | 'lesionado';

export interface Player {
  id: string;
  name: string;
  position: string;
  number: number;
  healthStatus: HealthStatus;
  injuryDescription?: string;
  weight?: number;
  targetWeight?: number;
  activePlans?: {
    training: string;
    nutrition: string;
  };
}

export const players: Player[] = [
  { id: '22222222-2222-2222-2222-222222222222', name: 'Michael Olise', position: 'Enganche', number: 10, healthStatus: 'disponible' },
  { id: '97891f2f-b2bb-4ffa-853e-915238584ec9', name: 'Lionel Messi', position: 'Delantero', number: 10, healthStatus: 'disponible', weight: 72, targetWeight: 70 },
  { id: '0e53b313-6c49-4809-963f-054bd6eafb55', name: 'Emiliano Martinez', position: 'Arquero', number: 23, healthStatus: 'disponible' },
  { id: '43aa146b-f564-4ef5-a451-52ff1d486e12', name: 'Rodrigo De Paul', position: 'Mediocampista', number: 7, healthStatus: 'lesionado', injuryDescription: 'Fatiga muscular' },
  { id: 'a6dc1ec6-15d6-4c81-90dc-e51f5b1a7e6f', name: 'Julian Alvarez', position: 'Delantero', number: 9, healthStatus: 'disponible' },
  { id: '56aeba36-1c92-41a8-8c70-e3d6be9f79b6', name: 'Alexis Mac Allister', position: 'Mediocampista', number: 20, healthStatus: 'disponible' },
  { id: '2ce62c1b-3ae0-4564-bd0b-3eacedb1bc93', name: 'Enzo Fernandez', position: 'Mediocampista', number: 24, healthStatus: 'duda', injuryDescription: 'Molestia en el tobillo' },
  { id: 'dd32899d-48cd-486c-92a9-8a67b4eee8e5', name: 'Cristian Romero', position: 'Defensor', number: 13, healthStatus: 'disponible' },
  { id: 'bb2b91e9-85b6-4aaf-9e47-ca692d5ef2e5', name: 'Lisandro Martinez', position: 'Defensor', number: 25, healthStatus: 'disponible' },
  { id: '15d41b3b-49a6-49ff-a248-25b7b86397b8', name: 'Nahuel Molina', position: 'Defensor', number: 26, healthStatus: 'disponible' },
  { id: '625afef8-1356-4a76-8b68-15d30c66ebd2', name: 'Nicolas Tagliafico', position: 'Defensor', number: 3, healthStatus: 'disponible' },
  { id: '7c9c5aab-4dcf-4641-9a5d-bda1acf81404', name: 'Angel Di Maria', position: 'Delantero', number: 11, healthStatus: 'disponible' },
  { id: '1dbacbcb-1143-4ca9-b93a-4babc26c357d', name: 'Lautaro Martinez', position: 'Delantero', number: 22, healthStatus: 'disponible' },
  { id: 'd57dabc2-b4f5-4167-8300-c358ed657a57', name: 'Paulo Dybala', position: 'Delantero', number: 21, healthStatus: 'disponible', weight: 75, targetWeight: 75, activePlans: { training: 'Fuerza de tren inferior', nutrition: 'Dieta hipercalórica' } },
  { id: 'd9df307f-40b5-42a7-9959-7d9ac5cc267f', name: 'Leandro Paredes', position: 'Mediocampista', number: 5, healthStatus: 'duda', injuryDescription: 'Sobrecarga muscular' },
  { id: '66973334-dd25-48b2-874c-7974e21c8230', name: 'Marcos Acuña', position: 'Defensor', number: 8, healthStatus: 'lesionado', injuryDescription: 'Pubalgia leve' },
  { id: '7d23ef28-8bda-44d7-8725-5293532212ca', name: 'Gonzalo Montiel', position: 'Defensor', number: 4, healthStatus: 'disponible' },
  { id: '56ca1adb-e526-4a9b-b0a1-ac3a4c61b54e', name: 'Nicolas Otamendi', position: 'Defensor', number: 19, healthStatus: 'disponible' },
];
