// @ts-nocheck
'use client';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Shield, Calendar, Clock, Save, Loader2,
  Key, LogOut, Trash2, Phone,
  Eye, EyeOff,
} from 'lucide-react';
import { formatBytes, statusColor } from '@/lib/formatters';
import type { User } from '@/types';

interface ProfileViewProps {
  user: User;
  profileEditing: boolean;
  setProfileEditing: (v: boolean) => void;
  profileForm: { firstName: string; lastName: string; phone: string; company: string; address: string; city: string; country: string };
  setProfileForm: (v: { firstName: string; lastName: string; phone: string; company: string; address: string; city: string; country: string }) => void;
  profileSaving: boolean;
  showChangePassword: boolean;
  setShowChangePassword: (v: boolean) => void;
  passwordForm: { currentPassword: string; newPassword: string; confirmPassword: string };
  setPasswordForm: (v: { currentPassword: string; newPassword: string; confirmPassword: string }) => void;
  passwordSaving: boolean;
  showCurrentPassword: boolean;
  setShowCurrentPassword: (v: boolean) => void;
  showNewPassword: boolean;
  setShowNewPassword: (v: boolean) => void;
  actionVerifyStep: 'idle' | 'request' | 'verify';
  setActionVerifyStep: (v: 'idle' | 'request' | 'verify') => void;
  actionVerifyOtp: string;
  setActionVerifyOtp: (v: string) => void;
  actionVerifyLoading: boolean;
  actionVerifyAction: string;
  onSaveProfile: () => void;
  onChangePassword: () => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
}

export default function ProfileView({
  user, profileEditing, setProfileEditing,
  profileForm, setProfileForm, profileSaving,
  showChangePassword, setShowChangePassword,
  passwordForm, setPasswordForm, passwordSaving,
  showCurrentPassword, setShowCurrentPassword,
  showNewPassword, setShowNewPassword,
  actionVerifyStep, setActionVerifyStep,
  actionVerifyOtp, setActionVerifyOtp,
  actionVerifyLoading, actionVerifyAction,
  onSaveProfile, onChangePassword,
  onLogout, onDeleteAccount,
}: ProfileViewProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* User Info Card */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-6 text-center sm:text-left">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xl">
                {user.firstName[0]}
                {user.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">{user.firstName} {user.lastName}</h2>
              <p className="text-slate-500">{user.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={statusColor(user.role)}>{user.role}</Badge>
                {user.phone && (
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {user.phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Account Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                <Shield className="w-4 h-4" />
                Role
              </div>
              <div className="font-medium capitalize">{user.role}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                <Calendar className="w-4 h-4" />
                Member Since
              </div>
              <div className="font-medium">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                <Clock className="w-4 h-4" />
                Last Login
              </div>
              <div className="font-medium">{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Now'}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Profile */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Edit Profile</CardTitle>
            {!profileEditing ? (
              <Button variant="outline" size="sm" className="border-slate-200 focus:border-emerald-400" onClick={() => setProfileEditing(true)}>
                Edit
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setProfileEditing(false)}>
                Cancel
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-600">First Name</Label>
              <Input className="bg-white border-slate-200 focus:border-emerald-400 text-slate-900" value={profileForm.firstName} onChange={e => setProfileForm(p => ({ ...p, firstName: e.target.value }))} disabled={!profileEditing} />
            </div>
            <div>
              <Label className="text-slate-600">Last Name</Label>
              <Input className="bg-white border-slate-200 focus:border-emerald-400 text-slate-900" value={profileForm.lastName} onChange={e => setProfileForm(p => ({ ...p, lastName: e.target.value }))} disabled={!profileEditing} />
            </div>
            <div>
              <Label className="text-slate-600">Phone</Label>
              <Input className="bg-white border-slate-200 focus:border-emerald-400 text-slate-900" value={profileForm.phone} onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))} disabled={!profileEditing} placeholder="+880 1XXXXXXXXX" />
            </div>
            <div>
              <Label className="text-slate-600">Company</Label>
              <Input className="bg-white border-slate-200 focus:border-emerald-400 text-slate-900" value={profileForm.company} onChange={e => setProfileForm(p => ({ ...p, company: e.target.value }))} disabled={!profileEditing} placeholder="Your company name" />
            </div>
            <div>
              <Label className="text-slate-600">Address</Label>
              <Input className="bg-white border-slate-200 focus:border-emerald-400 text-slate-900" value={profileForm.address} onChange={e => setProfileForm(p => ({ ...p, address: e.target.value }))} disabled={!profileEditing} placeholder="Street address" />
            </div>
            <div>
              <Label className="text-slate-600">City</Label>
              <Input className="bg-white border-slate-200 focus:border-emerald-400 text-slate-900" value={profileForm.city} onChange={e => setProfileForm(p => ({ ...p, city: e.target.value }))} disabled={!profileEditing} placeholder="City" />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-slate-600">Country</Label>
              <Input className="bg-white border-slate-200 focus:border-emerald-400 text-slate-900" value={profileForm.country} onChange={e => setProfileForm(p => ({ ...p, country: e.target.value }))} disabled={!profileEditing} placeholder="Country" />
            </div>
          </div>
          {profileEditing && (
            <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700" onClick={onSaveProfile} disabled={profileSaving}>
              {profileSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Change Password</CardTitle>
            {!showChangePassword && (
              <Button variant="outline" size="sm" className="border-slate-200 focus:border-emerald-400" onClick={() => setShowChangePassword(true)}>
                Change
              </Button>
            )}
          </div>
        </CardHeader>
        {showChangePassword && (
          <CardContent className="space-y-4">
            <div>
              <Label className="text-slate-600">Current Password</Label>
              <div className="relative">
                <Input className="bg-white border-slate-200 focus:border-emerald-400 text-slate-900 pr-10" type={showCurrentPassword ? 'text' : 'password'} value={passwordForm.currentPassword} onChange={e => setPasswordForm(p => ({ ...p, currentPassword: e.target.value }))} placeholder="Enter current password" />
                <Button variant="ghost" size="sm" className="absolute right-1 top-1 h-7 w-7" onClick={() => setShowCurrentPassword(!showCurrentPassword)}>
                  {showCurrentPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-slate-600">New Password</Label>
              <div className="relative">
                <Input className="bg-white border-slate-200 focus:border-emerald-400 text-slate-900 pr-10" type={showNewPassword ? 'text' : 'password'} value={passwordForm.newPassword} onChange={e => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))} placeholder="Min 6 characters" />
                <Button variant="ghost" size="sm" className="absolute right-1 top-1 h-7 w-7" onClick={() => setShowNewPassword(!showNewPassword)}>
                  {showNewPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-slate-600">Confirm New Password</Label>
              <Input className="bg-white border-slate-200 focus:border-emerald-400 text-slate-900" type="password" value={passwordForm.confirmPassword} onChange={e => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))} placeholder="Repeat new password" />
            </div>
            {actionVerifyStep === 'verify' && actionVerifyAction === 'password_change' && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 text-amber-700">
                  <Shield className="w-4 h-4" />
                  <span className="text-sm font-medium">Email Verification Required</span>
                </div>
                <p className="text-xs text-amber-600">A verification code has been sent to your email for security confirmation.</p>
                <div>
                  <Label className="text-slate-600">Verification Code</Label>
                  <Input className="bg-white border-slate-200 focus:border-emerald-400 text-slate-900 text-center text-xl tracking-[0.3em] font-mono" value={actionVerifyOtp} onChange={e => setActionVerifyOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" maxLength={6} />
                </div>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-2">
              {actionVerifyStep === 'verify' && actionVerifyAction === 'password_change' ? (
                <>
                  <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 w-full sm:w-auto" onClick={onChangePassword} disabled={actionVerifyLoading}>
                    {actionVerifyLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <span className="w-4 h-4 mr-2">✓</span>}
                    Verify & Update Password
                  </Button>
                  <Button variant="outline" className="border-slate-200 focus:border-emerald-400" onClick={() => { setActionVerifyStep('idle'); setActionVerifyOtp(''); }}>Cancel Verification</Button>
                </>
              ) : (
                <>
                  <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700" onClick={onChangePassword} disabled={passwordSaving || actionVerifyLoading}>
                    {passwordSaving || actionVerifyLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Key className="w-4 h-4 mr-2" />}
                    Verify & Update Password
                  </Button>
                  <Button variant="outline" className="border-slate-200 focus:border-emerald-400" onClick={() => { setShowChangePassword(false); setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); setActionVerifyStep('idle'); setActionVerifyOtp(''); }}>Cancel</Button>
                </>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Storage Usage */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Storage Usage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between text-sm gap-1">
            <span className="text-slate-500">Used: {formatBytes(user.storageUsed)}</span>
            <span className="text-slate-500">Limit: {formatBytes(user.storageLimit)}</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-4">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-4 rounded-full transition-all" style={{ width: `${Math.min((user.storageUsed / user.storageLimit) * 100, 100)}%` }} />
          </div>
          <p className="text-sm text-slate-500">{((user.storageUsed / user.storageLimit) * 100).toFixed(1)}% of your storage is used</p>
        </CardContent>
      </Card>

      {/* Logout */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-medium">Sign Out</h3>
              <p className="text-sm text-slate-500">Sign out of your account on this device</p>
            </div>
            <Button variant="outline" className="border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 w-full sm:w-auto" onClick={onLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Account */}
      <Card className="bg-white border-red-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-medium text-red-600">Delete Account</h3>
              <p className="text-sm text-slate-500">Permanently delete your account and all data. Requires email verification.</p>
            </div>
            <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 w-full sm:w-auto" onClick={onDeleteAccount}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
