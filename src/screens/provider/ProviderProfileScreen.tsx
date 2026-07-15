import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { ANALYTICS_EVENTS, trackEvent, trackScreenView } from '@/analytics';
import {
  addProviderGalleryItemRequest,
  createProviderServiceRequest,
  deleteProviderGalleryItemRequest,
  deleteProviderServiceRequest,
  getProviderProfileRequest,
  listProviderGalleryRequest,
  listProviderServicesRequest,
  reorderProviderGalleryRequest,
  updateProviderProfileRequest,
  updateProviderServiceRequest,
} from '@/api/providerDashboard';
import { useAuth } from '@/store';
import { theme } from '@/theme';
import { ProviderGalleryItem, ProviderProfile, ProviderService } from '@/types/providerDashboard';
import { Button, Card, Input, Loader, Text } from '@/ui';
import { formatPrice } from '@/utils/format';

export const ProviderProfileScreen: React.FC = () => {
  const { logout, switchExperience, userEmail } = useAuth();
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [services, setServices] = useState<ProviderService[]>([]);
  const [galleryItems, setGalleryItems] = useState<ProviderGalleryItem[]>([]);
  const [displayName, setDisplayName] = useState('');
  const [city, setCity] = useState('');
  const [bio, setBio] = useState('');
  const [instituteAddress, setInstituteAddress] = useState('');
  const [homeServiceZones, setHomeServiceZones] = useState('');
  const [price, setPrice] = useState('');
  const [homeEnabled, setHomeEnabled] = useState(false);
  const [instituteEnabled, setInstituteEnabled] = useState(false);
  const [serviceName, setServiceName] = useState('');
  const [serviceCategory, setServiceCategory] = useState('');
  const [serviceDuration, setServiceDuration] = useState('45');
  const [servicePrice, setServicePrice] = useState('');
  const [galleryMediaId, setGalleryMediaId] = useState('');
  const [galleryTitle, setGalleryTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingService, setIsSavingService] = useState(false);
  const [isSavingGallery, setIsSavingGallery] = useState(false);

  const hydrateForm = (nextProfile: ProviderProfile): void => {
    setProfile(nextProfile);
    setDisplayName(nextProfile.displayName);
    setCity(nextProfile.city);
    setBio(nextProfile.bio ?? '');
    setInstituteAddress(nextProfile.instituteAddress ?? '');
    setHomeServiceZones(nextProfile.homeServiceZones.join('\n'));
    setPrice(nextProfile.priceFromCents ? String(nextProfile.priceFromCents / 100) : '');
    setHomeEnabled(nextProfile.serviceModes.includes('home'));
    setInstituteEnabled(nextProfile.serviceModes.includes('institute'));
  };

  const loadProfile = useCallback(async (): Promise<void> => {
    try {
      const [profileResult, servicesResult, galleryResult] = await Promise.all([
        getProviderProfileRequest(),
        listProviderServicesRequest(),
        listProviderGalleryRequest(),
      ]);
      hydrateForm(profileResult);
      setServices(servicesResult);
      setGalleryItems(galleryResult);
    } catch {
      Alert.alert('Profil indisponible', 'Impossible de charger le profil professionnel.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    trackScreenView(ANALYTICS_EVENTS.SCREEN_VIEW_PROVIDER_PROFILE, 'ProviderProfile');
    void loadProfile();
  }, [loadProfile]);

  const saveProfile = async (): Promise<void> => {
    setIsSaving(true);
    const parsedPrice = Number(price.replace(',', '.'));
    const serviceModes = [
      ...(homeEnabled ? ['home' as const] : []),
      ...(instituteEnabled ? ['institute' as const] : []),
    ];
    const zones = homeServiceZones
      .split(/\r?\n|,/)
      .map((zone) => zone.trim())
      .filter(Boolean);

    try {
      const result = await updateProviderProfileRequest({
        displayName,
        city,
        bio: bio.trim() ? bio : null,
        instituteAddress: instituteAddress.trim() ? instituteAddress : null,
        homeServiceZones: zones,
        priceFromCents: Number.isFinite(parsedPrice) ? Math.round(parsedPrice * 100) : null,
        serviceModes,
      });
      trackEvent(ANALYTICS_EVENTS.PROVIDER_PROFILE_UPDATED, {
        screen_name: 'ProviderProfile',
        status: 'success',
      });
      hydrateForm(result);
      Alert.alert('Profil mis à jour', 'Les informations professionnelles sont enregistrées.');
    } catch {
      Alert.alert('Enregistrement impossible', 'Vérifie les champs puis réessaie.');
    } finally {
      setIsSaving(false);
    }
  };

  const createService = async (): Promise<void> => {
    const durationMinutes = Number(serviceDuration);
    const parsedPrice = Number(servicePrice.replace(',', '.'));
    if (!serviceName.trim() || !serviceCategory.trim() || !Number.isFinite(durationMinutes)) {
      Alert.alert('Prestation incomplète', 'Nom, catégorie et durée sont obligatoires.');
      return;
    }

    setIsSavingService(true);
    try {
      await createProviderServiceRequest({
        name: serviceName,
        category: serviceCategory,
        durationMinutes,
        priceCents: Number.isFinite(parsedPrice) ? Math.round(parsedPrice * 100) : 0,
        isActive: true,
      });
      trackEvent(ANALYTICS_EVENTS.PROVIDER_SERVICE_UPDATED, {
        screen_name: 'ProviderProfile',
        status: 'success',
        code: 'created',
      });
      setServiceName('');
      setServiceCategory('');
      setServiceDuration('45');
      setServicePrice('');
      setServices(await listProviderServicesRequest());
    } catch {
      Alert.alert('Prestation non ajoutée', 'Vérifie les champs ou évite les doublons.');
    } finally {
      setIsSavingService(false);
    }
  };

  const toggleService = async (service: ProviderService): Promise<void> => {
    try {
      await updateProviderServiceRequest(service.id, {
        name: service.name,
        category: service.category,
        durationMinutes: service.durationMinutes,
        priceCents: service.priceCents,
        isActive: !service.isActive,
      });
      trackEvent(ANALYTICS_EVENTS.PROVIDER_SERVICE_UPDATED, {
        screen_name: 'ProviderProfile',
        status: 'success',
        code: service.isActive ? 'disabled' : 'enabled',
      });
      setServices(await listProviderServicesRequest());
    } catch {
      Alert.alert('Modification impossible', 'La prestation est peut-être introuvable.');
    }
  };

  const deleteService = async (serviceId: string): Promise<void> => {
    try {
      await deleteProviderServiceRequest(serviceId);
      trackEvent(ANALYTICS_EVENTS.PROVIDER_SERVICE_UPDATED, {
        screen_name: 'ProviderProfile',
        status: 'success',
        code: 'deleted',
      });
      setServices(await listProviderServicesRequest());
    } catch {
      Alert.alert('Suppression impossible', 'La prestation est peut-être introuvable.');
    }
  };

  const addGalleryItem = async (): Promise<void> => {
    const mediaId = Number(galleryMediaId);
    if (!Number.isFinite(mediaId) || mediaId <= 0) {
      Alert.alert('Media invalide', 'Renseigne un mediaId valide.');
      return;
    }

    setIsSavingGallery(true);
    try {
      await addProviderGalleryItemRequest({
        mediaId,
        title: galleryTitle.trim() ? galleryTitle : null,
      });
      trackEvent(ANALYTICS_EVENTS.PROVIDER_GALLERY_UPDATED, {
        screen_name: 'ProviderProfile',
        status: 'success',
        code: 'added',
      });
      setGalleryMediaId('');
      setGalleryTitle('');
      setGalleryItems(await listProviderGalleryRequest());
    } catch {
      Alert.alert('Photo non ajoutée', "Le média doit appartenir au compte prestataire.");
    } finally {
      setIsSavingGallery(false);
    }
  };

  const deleteGalleryItem = async (itemId: string): Promise<void> => {
    try {
      await deleteProviderGalleryItemRequest(itemId);
      trackEvent(ANALYTICS_EVENTS.PROVIDER_GALLERY_UPDATED, {
        screen_name: 'ProviderProfile',
        status: 'success',
        code: 'deleted',
      });
      setGalleryItems(await listProviderGalleryRequest());
    } catch {
      Alert.alert('Suppression impossible', 'Cette photo est peut-être introuvable.');
    }
  };

  const moveGalleryItem = async (index: number, direction: -1 | 1): Promise<void> => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= galleryItems.length) {
      return;
    }

    const nextItems = [...galleryItems];
    const [item] = nextItems.splice(index, 1);
    nextItems.splice(nextIndex, 0, item);
    try {
      setGalleryItems(await reorderProviderGalleryRequest(nextItems.map((nextItem) => nextItem.id)));
      trackEvent(ANALYTICS_EVENTS.PROVIDER_GALLERY_UPDATED, {
        screen_name: 'ProviderProfile',
        status: 'success',
        code: 'reordered',
      });
    } catch {
      Alert.alert('Ordre non modifié', "Impossible d'enregistrer l'ordre des photos.");
    }
  };

  if (isLoading) {
    return <Loader fullScreen text="Chargement du profil pro..." />;
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.heroCard}>
          <Text variant="heading" size="xl" weight="bold">
            Profil professionnel
          </Text>
          <Text size="sm" color="secondary">
            {userEmail}
          </Text>
          {profile ? (
            <Text size="sm" color="accent">
              {profile.rating.toFixed(1)} / 5 · {profile.reviewCount} avis
            </Text>
          ) : null}
        </Card>

        <Card style={styles.formCard}>
          <Text variant="heading" size="lg" weight="bold">
            Galerie photo
          </Text>
          <Input
            label="Media ID"
            value={galleryMediaId}
            onChangeText={setGalleryMediaId}
            keyboardType="number-pad"
          />
          <Input label="Titre photo" value={galleryTitle} onChangeText={setGalleryTitle} />
          <Button
            title="Ajouter la photo"
            onPress={addGalleryItem}
            loading={isSavingGallery}
            fullWidth
          />
          {galleryItems.length === 0 ? (
            <Text size="sm" color="secondary">
              Aucune photo dans la galerie.
            </Text>
          ) : (
            <View style={styles.galleryList}>
              {galleryItems.map((item, index) => (
                <View key={item.id} style={styles.galleryRow}>
                  {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={styles.galleryThumb} />
                  ) : (
                    <View style={styles.galleryThumb} />
                  )}
                  <View style={styles.galleryText}>
                    <Text size="sm" weight="semibold">
                      {item.title || `Photo ${index + 1}`}
                    </Text>
                    <Text size="xs" color="secondary">
                      Media #{item.mediaId}
                    </Text>
                  </View>
                  <View style={styles.galleryActions}>
                    <Button
                      title="Haut"
                      size="sm"
                      variant="outline"
                      disabled={index === 0}
                      onPress={() => void moveGalleryItem(index, -1)}
                    />
                    <Button
                      title="Bas"
                      size="sm"
                      variant="outline"
                      disabled={index === galleryItems.length - 1}
                      onPress={() => void moveGalleryItem(index, 1)}
                    />
                    <Button
                      title="Supprimer"
                      size="sm"
                      variant="outline"
                      onPress={() => void deleteGalleryItem(item.id)}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}
        </Card>

        <Card style={styles.formCard}>
          <Input label="Nom public" value={displayName} onChangeText={setDisplayName} />
          <Input label="Ville" value={city} onChangeText={setCity} />
          <Input
            label="Bio"
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={4}
            style={styles.textArea}
          />
          <Input
            label="Adresse institut"
            value={instituteAddress}
            onChangeText={setInstituteAddress}
          />
          <Input
            label="Zones de déplacement"
            value={homeServiceZones}
            onChangeText={setHomeServiceZones}
            multiline
            numberOfLines={3}
            style={styles.zonesInput}
          />
          <Input
            label="Prix d'appel en euros"
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
          />

          <View style={styles.switchRow}>
            <Text size="sm">Prestation à domicile</Text>
            <Switch
              value={homeEnabled}
              onValueChange={setHomeEnabled}
              trackColor={{ false: theme.colors.secondaryText, true: theme.colors.accentChampagne }}
              thumbColor={theme.colors.primaryText}
            />
          </View>
          <View style={styles.switchRow}>
            <Text size="sm">Prestation en institut</Text>
            <Switch
              value={instituteEnabled}
              onValueChange={setInstituteEnabled}
              trackColor={{ false: theme.colors.secondaryText, true: theme.colors.accentChampagne }}
              thumbColor={theme.colors.primaryText}
            />
          </View>

          <Button title="Enregistrer" onPress={saveProfile} loading={isSaving} fullWidth />
        </Card>

        <Card style={styles.formCard}>
          <Text variant="heading" size="lg" weight="bold">
            Catalogue prestations
          </Text>
          <Input label="Nom prestation" value={serviceName} onChangeText={setServiceName} />
          <Input
            label="Catégorie"
            value={serviceCategory}
            onChangeText={setServiceCategory}
          />
          <View style={styles.catalogInputs}>
            <Input
              label="Durée min."
              value={serviceDuration}
              onChangeText={setServiceDuration}
              keyboardType="number-pad"
              style={styles.catalogInput}
            />
            <Input
              label="Prix euros"
              value={servicePrice}
              onChangeText={setServicePrice}
              keyboardType="decimal-pad"
              style={styles.catalogInput}
            />
          </View>
          <Button
            title="Ajouter une prestation"
            onPress={createService}
            loading={isSavingService}
            fullWidth
          />

          {services.length === 0 ? (
            <Text size="sm" color="secondary">
              Aucune prestation configurée.
            </Text>
          ) : (
            <View style={styles.serviceList}>
              {services.map((service) => (
                <View key={service.id} style={styles.serviceRow}>
                  <View style={styles.serviceText}>
                    <Text size="sm" weight="semibold">
                      {service.name}
                    </Text>
                    <Text size="xs" color="secondary">
                      {service.category} · {service.durationMinutes} min ·{' '}
                      {formatPrice(service.priceCents / 100)}
                    </Text>
                    <Text size="xs" color={service.isActive ? 'accent' : 'secondary'}>
                      {service.isActive ? 'Actif' : 'Inactif'}
                    </Text>
                  </View>
                  <View style={styles.serviceActions}>
                    <Button
                      title={service.isActive ? 'Désactiver' : 'Activer'}
                      size="sm"
                      variant="outline"
                      onPress={() => void toggleService(service)}
                    />
                    <Button
                      title="Supprimer"
                      size="sm"
                      variant="outline"
                      onPress={() => void deleteService(service.id)}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}
        </Card>

        <Card style={styles.formCard}>
          <Text variant="heading" size="lg" weight="bold">
            Session
          </Text>
          <Text size="sm" color="secondary">
            Compte prestataire connecté sur cet appareil.
          </Text>
          <Button
            title="Passer en vue client"
            variant="secondary"
            onPress={() => switchExperience('client')}
            fullWidth
          />
          <Button title="Se déconnecter" variant="outline" onPress={logout} fullWidth />
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.md,
  },
  heroCard: {
    gap: theme.spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(214, 179, 106, 0.28)',
  },
  formCard: {
    gap: theme.spacing.md,
  },
  textArea: {
    minHeight: 112,
    textAlignVertical: 'top',
  },
  zonesInput: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  catalogInputs: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  catalogInput: {
    flex: 1,
  },
  serviceList: {
    gap: theme.spacing.sm,
  },
  serviceRow: {
    gap: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.background,
    paddingTop: theme.spacing.sm,
  },
  serviceText: {
    gap: 2,
  },
  serviceActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  galleryList: {
    gap: theme.spacing.sm,
  },
  galleryRow: {
    gap: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.background,
    paddingTop: theme.spacing.sm,
  },
  galleryThumb: {
    width: '100%',
    height: 132,
    borderRadius: 8,
    backgroundColor: theme.colors.background,
  },
  galleryText: {
    gap: 2,
  },
  galleryActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
});
