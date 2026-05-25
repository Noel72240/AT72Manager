import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { HardDrive, Plug, ScrollText, Settings2, Shield, Users } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { PermissionGate } from '@/components/auth/PermissionGate'
import { usePermissions } from '@/hooks/usePermissions'
import { useAuthStore } from '@/store/auth.store'
import { useBackupStore } from '@/store/backup.store'
import { BackupActionsPanel } from '@/modules/settings/components/BackupActionsPanel'
import { BackupTimeline, BackupIntegrityBanner } from '@/modules/settings/components/BackupTimeline'
import { BackupSettingsPanel } from '@/modules/settings/components/BackupSettingsPanel'
import { AuditTrailPanel } from '@/modules/users/components/AuditTrailPanel'
import { SecurityLogsPanel } from '@/modules/users/components/SecurityLogsPanel'
import { TeamMembersPanel } from '@/modules/users/components/TeamMembersPanel'
import { GoogleCalendarSettingsPanel } from '@/modules/settings/components/GoogleCalendarSettingsPanel'
import { DesktopProductionPanel } from '@/modules/settings/components/DesktopProductionPanel'
import { DEFAULT_BACKUP_SETTINGS } from '@/services/backup/backup.types'
import { staggerContainer, fadeInUp } from '@/utils/motion'

type SettingsTab = 'general' | 'backup' | 'team' | 'audit' | 'security' | 'integrations'

export function SettingsPage() {
  const userId = useAuthStore((s) => s.user?.id)
  const loadTeamMembers = useAuthStore((s) => s.loadTeamMembers)
  const { can } = usePermissions()
  const [searchParams, setSearchParams] = useSearchParams()
  const [tab, setTab] = useState<SettingsTab>('backup')

  const {
    snapshots,
    settings,
    loading,
    exporting,
    restoring,
    lastError,
    load,
    updateSettings,
    exportJson,
    exportZip,
    importFile,
    rollback,
    removeSnapshot,
  } = useBackupStore()

  useEffect(() => {
    if (userId) void load(userId)
  }, [userId, load])

  useEffect(() => {
    const requested = searchParams.get('tab')
    if (
      requested === 'team' ||
      requested === 'audit' ||
      requested === 'security' ||
      requested === 'backup' ||
      requested === 'general' ||
      requested === 'integrations'
    ) {
      setTab(requested)
    }
  }, [searchParams])

  useEffect(() => {
    if (tab === 'team') void loadTeamMembers()
  }, [tab, loadTeamMembers])

  const tabs = useMemo(
    () =>
      [
        { id: 'backup' as const, label: 'Sauvegardes', icon: HardDrive, show: can('backups', 'read') },
        { id: 'team' as const, label: 'Équipe', icon: Users, show: can('users', 'read') },
        { id: 'audit' as const, label: 'Audit', icon: ScrollText, show: can('audit', 'read') },
        { id: 'security' as const, label: 'Sécurité', icon: Shield, show: can('settings', 'manage') },
        { id: 'integrations' as const, label: 'Intégrations', icon: Plug, show: can('settings', 'read') },
        { id: 'general' as const, label: 'Général', icon: Settings2, show: can('settings', 'read') },
      ].filter((item) => item.show),
    [can],
  )

  function selectTab(next: SettingsTab) {
    setTab(next)
    setSearchParams({ tab: next })
  }

  if (!userId) return null

  const backupSettings = settings ?? DEFAULT_BACKUP_SETTINGS

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="mx-auto max-w-6xl space-y-8 pb-12"
    >
      <motion.header variants={fadeInUp} className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-muted ring-1 ring-neon-blue/30">
            <Shield className="h-6 w-6 text-neon-blue" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-neon-blue">
              Protection des données
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">
              Paramètres & Équipe
            </h1>
          </div>
          <span className="ml-auto rounded-full bg-accent-muted px-3 py-1 text-xs font-semibold text-neon-green ring-1 ring-neon-green/30">
            Premium
          </span>
        </div>
        <p className="max-w-2xl text-sm text-text-muted">
          Gestion collaborative, rôles, audit trail, sécurité et sauvegardes versionnées — offline-first
          avec sync Supabase.
        </p>
      </motion.header>

      <motion.nav
        variants={fadeInUp}
        className="flex gap-2 rounded-xl border border-border/60 bg-surface-elevated/50 p-1"
      >
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => selectTab(id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
              tab === id
                ? 'bg-primary text-white shadow-card'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </motion.nav>

      {lastError && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          {lastError}
        </motion.div>
      )}

      {tab === 'integrations' && can('settings', 'read') && <GoogleCalendarSettingsPanel />}

      {tab === 'general' && (
        <motion.div variants={fadeInUp} className="space-y-6">
          <DesktopProductionPanel />
          <motion.section className="rounded-xl border border-border bg-surface-elevated/80 p-6">
            <h2 className="text-lg font-semibold text-text-primary">Apparence</h2>
            <p className="mt-1 text-sm text-text-muted">
              Thème sombre optimisé atelier (mode clair bientôt disponible).
            </p>
            <p className="mt-4 text-sm text-text-secondary">
              Thème actuel : <strong className="text-text-primary">Sombre</strong>
            </p>
          </motion.section>
        </motion.div>
      )}

      {tab === 'backup' && can('backups', 'read') && (
        <motion.div variants={fadeInUp} className="space-y-8">
          <BackupIntegrityBanner verified />

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-8 lg:col-span-2">
              <PermissionGate resource="backups" action="create">
                <BackupActionsPanel
                  exporting={exporting}
                  restoring={restoring}
                  onExportJson={() => void exportJson(userId)}
                  onExportZip={() => void exportZip(userId)}
                  onImport={(file, entities) => void importFile(userId, file, entities)}
                />
              </PermissionGate>

              <section>
                <h2 className="mb-4 text-lg font-semibold text-text-primary">Historique des sauvegardes</h2>
                {loading ? (
                  <p className="text-sm text-text-muted">Chargement…</p>
                ) : (
                  <BackupTimeline
                    snapshots={snapshots}
                    restoring={restoring}
                    onRollback={(id) => void rollback(userId, id)}
                    onDelete={(id) => void removeSnapshot(userId, id)}
                  />
                )}
              </section>
            </div>

            <PermissionGate resource="backups" action="manage">
              <BackupSettingsPanel
                settings={backupSettings}
                onChange={(next) => useBackupStore.setState({ settings: next })}
                onSave={() => void updateSettings(backupSettings)}
              />
            </PermissionGate>
          </div>
        </motion.div>
      )}

      {tab === 'team' && can('users', 'read') && <TeamMembersPanel />}
      {tab === 'audit' && can('audit', 'read') && <AuditTrailPanel />}
      {tab === 'security' && can('settings', 'manage') && <SecurityLogsPanel />}
    </motion.div>
  )
}
