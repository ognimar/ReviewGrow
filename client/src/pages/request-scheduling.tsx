import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Play, Pause, Clock, Info, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";

interface UserData {
  followUpSettings?: {
    enabled?: boolean;
    followUpCount?: number;
  };
}

export default function RequestScheduling() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [isActive, setIsActive] = useState(true);
  const [followUpCount, setFollowUpCount] = useState(2);
  const [isSaving, setIsSaving] = useState(false);

  const { data: userData, isLoading } = useQuery<UserData>({
    queryKey: ['user-data'],
    queryFn: async () => {
      if (!user) return null;
      const token = await user.getIdToken();
      const res = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
        }),
      });
      const data = await res.json();
      return data.user;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (userData?.followUpSettings) {
      setIsActive(userData.followUpSettings.enabled ?? true);
      setFollowUpCount(userData.followUpSettings.followUpCount ?? 2);
    }
  }, [userData]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/settings/follow-up', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          enabled: isActive,
          followUpCount,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save settings');
      }
      
      queryClient.invalidateQueries({ queryKey: ['user-data'] });
      toast({ title: 'Ustawienia zapisane!' });
    } catch (error) {
      toast({ title: 'Błąd', description: 'Nie udało się zapisać ustawień', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePauseToggle = async () => {
    if (!user) return;
    const newStatus = !isActive;
    setIsActive(newStatus);
    
    try {
      const token = await user.getIdToken();
      await fetch('/api/settings/follow-up', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          enabled: newStatus,
          followUpCount,
        }),
      });
      queryClient.invalidateQueries({ queryKey: ['user-data'] });
      toast({ title: newStatus ? 'Wznowiono wysyłanie' : 'Wstrzymano wysyłanie' });
    } catch (error) {
      setIsActive(!newStatus);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-gray-400'}`}></div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900" data-testid="text-page-title">
                {isActive ? 'Review requests active' : 'Review requests paused'}
              </h1>
              <p className="text-sm text-gray-500">
                {isActive ? 'Messages are being sent as scheduled' : 'Messages are currently paused'}
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={handlePauseToggle}
            className="flex items-center gap-2"
            data-testid="button-pause-toggle"
          >
            {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isActive ? 'Pause' : 'Resume'}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl border p-8" data-testid="panel-initial-scheduling">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Initial Request Scheduling</h2>
            <p className="text-sm text-gray-500 mb-8">
              Choose when to send review requests to your contacts after receiving their information.
            </p>
            
            <div className="text-center py-8">
              <p className="text-4xl font-bold text-emerald-600" data-testid="text-scheduling-value">Right Away</p>
            </div>
            
            <div className="mt-8 bg-amber-50 rounded-lg p-4 border border-amber-100">
              <div className="flex items-start gap-2">
                <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800 text-sm">Important Notes:</p>
                  <ul className="mt-2 space-y-1 text-sm text-amber-700">
                    <li>• Review requests are only sent between 9 AM - 7 PM local time</li>
                    <li>• If scheduled outside these hours, the request will be sent the next day</li>
                    <li>• If you need to schedule review requests at specific times in the future, please contact <span className="text-emerald-600">support@reviewharvest.pl</span></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border p-8" data-testid="panel-followup-messages">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Follow-Up Messages</h2>
            <p className="text-sm text-gray-500 mb-8">
              Choose how many follow-up messages to send if a contact doesn't respond to the initial review request.
            </p>
            
            <div className="text-center py-8">
              <p className="text-4xl font-bold text-emerald-600" data-testid="text-followup-count">
                {followUpCount} follow-up{followUpCount !== 1 ? 's' : ''}
              </p>
            </div>
            
            <div className="px-4 mt-4">
              <Slider
                value={[followUpCount]}
                onValueChange={(value) => setFollowUpCount(value[0])}
                min={0}
                max={5}
                step={1}
                className="w-full"
                data-testid="slider-followup-count"
              />
              <div className="flex justify-between mt-2 text-xs text-gray-400">
                <span>0</span>
                <span>1</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
                <span>5</span>
              </div>
            </div>
            
            <div className="mt-8 bg-emerald-50 rounded-lg p-4 border border-emerald-100">
              <div className="flex items-start gap-2">
                <Info className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-emerald-800 text-sm">About Follow-Ups:</p>
                  <ul className="mt-2 space-y-1 text-sm text-emerald-700">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3" /> Follow-ups are sent 3 days after the previous message
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3" /> Contacts who click your review link won't receive follow-ups
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3" /> You can stop follow-ups for individual contacts from the contacts page
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <Button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-emerald-600 hover:bg-emerald-700"
            data-testid="button-save-settings"
          >
            {isSaving ? 'Zapisywanie...' : 'Zapisz ustawienia'}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
