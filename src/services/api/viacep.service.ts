export type ViaCepResponse = {
  cep: string;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  ibge?: string;
  erro?: boolean;
};

export async function getAddressByCep(cepDigits: string): Promise<ViaCepResponse> {
  const res = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
  if (!res.ok) {
    throw new Error(`ViaCEP error: ${res.status}`);
  }
  return res.json() as Promise<ViaCepResponse>;
}
