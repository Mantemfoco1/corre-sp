function filtrarCorridas(corridas, filtros) {
  return corridas.filter((corrida) => {
    // Data exata: formato YYYY-MM-DD
    if (
      filtros.data &&
      corrida.data !== filtros.data
    ) {
      return false;
    }

    // Se a distância não foi informada,
    // não exclua a corrida automaticamente.
    if (
      filtros.distancia &&
      corrida.distancias.length > 0 &&
      !corrida.distancias.includes(
        Number(filtros.distancia)
      )
    ) {
      return false;
    }

    // Preço desconhecido continua aparecendo.
    if (
      filtros.precoMaximo !== "" &&
      corrida.preco !== null &&
      Number(corrida.preco) >
        Number(filtros.precoMaximo)
    ) {
      return false;
    }

    return true;
  });
}
