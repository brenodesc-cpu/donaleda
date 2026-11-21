import { describe, expect, it } from 'vitest';
import { avaliarFala } from '@/lib/regras';

describe('regras fixas de segurança', () => {
  it.each([
    'Ai, minha filha, eu caí no banheiro agora de manhã',
    'Levei um tombo na cozinha',
    'Tô com uma dor no peito desde cedo',
    'Estou com falta de ar',
    'Não consigo me levantar do chão',
    'Acho que desmaiei ontem à noite',
  ])('avisa como urgente: %s', (fala) => {
    const alerta = avaliarFala(fala);
    expect(alerta?.tipo).toBe('emergencia');
    expect(alerta?.gravidade).toBe('urgente');
    expect(alerta?.texto).toContain('192');
  });

  it.each([
    'Caí na risada com a novela',
    'Só agora caiu a ficha',
    'Caiu a luz aqui em casa',
    'Dormi bem, tomei meu café e reguei as orquídeas',
    'Meu neto caiu de bicicleta mas não foi nada',
  ])('não dispara à toa: %s', (fala) => {
    expect(avaliarFala(fala)).toBeNull();
  });

  it.each([
    'Um moço do banco ligou pedindo a minha senha',
    'Mandaram mensagem no WhatsApp dizendo que era meu filho e pedindo um Pix',
    'Ligaram falando que era do banco e pediram o código do cartão',
  ])('reconhece possível golpe: %s', (fala) => {
    const alerta = avaliarFala(fala);
    expect(alerta?.tipo).toBe('golpe');
    expect(alerta?.gravidade).toBe('atencao');
  });

  it('falar de Pix sem ninguém pedindo não é golpe', () => {
    expect(avaliarFala('Eu fiz um Pix pra minha filha ontem')).toBeNull();
  });

  it('fala de não querer mais viver vira aviso urgente com o CVV', () => {
    const alerta = avaliarFala('Tem dia que eu não quero mais viver');
    expect(alerta?.gravidade).toBe('urgente');
    expect(alerta?.tipo).toBe('humor');
    expect(alerta?.texto).toContain('188');
  });

  it('morrer de rir não é aviso', () => {
    expect(avaliarFala('Morri de rir com o Pedro hoje')).toBeNull();
  });
});

describe('golpe: palavras que faltavam (verificador, 21/11)', () => {
  it.each([
    'Ligaram dizendo que era do banco e pediram o meu CPF',
    'Um homem ligou pedindo dinheiro pro meu neto',
    'Acho que caí num golpe, me mandaram uma mensagem',
  ])('avisa: %s', (fala) => {
    expect(avaliarFala(fala)?.tipo).toBe('golpe');
  });

  it('sequestro é aviso urgente, mesmo sem pedido de dinheiro na mesma frase', () => {
    const alerta = avaliarFala('Ligaram dizendo que sequestraram o meu neto');
    expect(alerta?.tipo).toBe('golpe');
    expect(alerta?.gravidade).toBe('urgente');
  });

  it('dinheiro ou senha já passados viram urgente', () => {
    expect(avaliarFala('Um moço do banco ligou e eu já passei a senha')?.gravidade).toBe('urgente');
    expect(avaliarFala('Mandaram mensagem pedindo Pix e eu já fiz o pix')?.gravidade).toBe('urgente');
  });

  it('receber dinheiro da aposentadoria não é golpe', () => {
    expect(avaliarFala('Recebi o dinheiro da aposentadoria hoje')).toBeNull();
  });
});
