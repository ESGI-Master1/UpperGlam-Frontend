import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { getProviderProfileRequest, updateProviderProfileRequest } from '@/api/providerDashboard';
import { useAuth } from '@/store';
import { theme } from '@/theme';
import { ProviderProfile } from '@/types/providerDashboard';
import { Button, Card, Input, Loader, Text } from '@/ui';

export const ProviderProfileScreen: React.FC = () => {
  const { logout, switchExperience, userEmail } = useAuth();
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [city, setCity] = useState('');
  const [bio, setBio] = useState('');
  const [instituteAddress, setInstituteAddress] = useState('');
  const [homeServiceZones, setHomeServiceZones] = useState('');
  const [price, setPrice] = useState('');
  const [homeEnabled, setHomeEnabled] = useState(false);
  const [instituteEnabled, setInstituteEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

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
      const result = await getProviderProfileRequest();
      hydrateForm(result);
    } catch {
      Alert.alert('Profil indisponible', 'Impossible de charger le profil professionnel.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
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
      hydrateForm(result);
      Alert.alert('Profil mis à jour', 'Les informations professionnelles sont enregistrées.');
    } catch {
      Alert.alert('Enregistrement impossible', 'Vérifie les champs puis réessaie.');
    } finally {
      setIsSaving(false);
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
});
