import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { ThemedText } from '@/componentes/comun/ThemedText';
import { useTheme } from '@/hooks/useTheme';

export interface ReproductorVideoEspacioProps {
  videoUrl: string | null;
  tituloEspacio: string;
}

export function ReproductorVideoEspacio({
  videoUrl,
  tituloEspacio,
}: ReproductorVideoEspacioProps) {
  const { paleta } = useTheme();

  // Si la cancha no tiene video cargado
  if (!videoUrl) {
    return (
      <View
        style={[
          estilos.tarjetaSinVideo,
          { backgroundColor: paleta.superficie, borderColor: paleta.borde },
        ]}
      >
        <Ionicons name="videocam-off-outline" size={32} color={paleta.textoSecundario} />
        <ThemedText style={[estilos.textoSinVideo, { color: paleta.textoSecundario }]}>
          Este espacio no cuenta con video de recorrido 360° disponible.
        </ThemedText>
      </View>
    );
  }

  if (Platform.OS === 'web') {
    return (
      <View
        style={[
          estilos.contenedorVideo,
          { backgroundColor: '#000000', borderColor: paleta.borde },
        ]}
      >
        {/* Video en web */}
        {React.createElement('video', {
          src: videoUrl,
          controls: true,
          loop: true,
          playsInline: true,
          style: {
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            backgroundColor: '#000000',
          },
        })}
        <View style={estilos.etiquetaVideo}>
          <Ionicons name="videocam" size={14} color="#FFFFFF" />
          <ThemedText style={estilos.textoEtiqueta}>Recorrido audiovisual</ThemedText>
        </View>
      </View>
    );
  }

  return <ReproductorActivo videoUrl={videoUrl} tituloEspacio={tituloEspacio} />;
}

function ReproductorActivo({
  videoUrl,
  tituloEspacio,
}: {
  videoUrl: string;
  tituloEspacio: string;
}) {
  const { paleta } = useTheme();

  const player = useVideoPlayer(videoUrl, (p) => {
    p.loop = true;
    p.muted = false;
  });

  return (
    <View
      style={[
        estilos.contenedorVideo,
        { backgroundColor: '#000000', borderColor: paleta.borde },
      ]}
      accessibilityRole="none"
      accessibilityLabel={`Video de recorrido de ${tituloEspacio}`}
    >
      <VideoView
        player={player}
        style={estilos.video}
        nativeControls={true}
        contentFit="contain"
      />
      <View style={estilos.etiquetaVideo}>
        <Ionicons name="videocam" size={14} color="#FFFFFF" />
        <ThemedText style={estilos.textoEtiqueta}>Recorrido audiovisual (20-30s)</ThemedText>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedorVideo: {
    width: '100%',
    height: 220,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 16,
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  etiquetaVideo: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(11, 58, 93, 0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  textoEtiqueta: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  tarjetaSinVideo: {
    width: '100%',
    height: 140,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginBottom: 16,
    gap: 8,
  },
  textoSinVideo: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
