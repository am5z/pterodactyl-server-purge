import React, { useState } from 'react';
import axios from 'axios';
import { AlertCircle, Server, Trash2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Progress } from '../components/ui/progress';

const PterodactylServerPurge = () => {
  const [credentials, setCredentials] = useState({
    panelUrl: '',
    apiKey: '',
    nodeIds: '',
    excludedNameKeyword: ''
  });
  const [servers, setServers] = useState([]);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState({ total: 0, deleted: 0, skipped: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const fetchAllServers = async () => {
    setError(null);
    let allServers = [];
    let page = 1;
    const perPage = 100;

    const headers = {
      'Authorization': `Bearer ${credentials.apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    while (true) {
      try {
        const response = await axios.get(`${credentials.panelUrl}/api/application/servers`, {
          headers,
          params: { page, per_page: perPage }
        });
        const newServers = response.data.data;
        if (newServers.length === 0) break;
        allServers = allServers.concat(newServers);
        page += 1;
      } catch (error) {
        setError(`Error fetching servers: ${error.message}`);
        break;
      }
    }

    return allServers;
  };

  const deleteServer = async (serverId) => {
    const headers = {
      'Authorization': `Bearer ${credentials.apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    try {
      await axios.delete(`${credentials.panelUrl}/api/application/servers/${serverId}`, { headers });
      return true;
    } catch (error) {
      setError(`Error deleting server ${serverId}: ${error.message}`);
      return false;
    }
  };

  const purgeServers = async () => {
    setIsProcessing(true);
    setProgress(0);
    setStats({ total: 0, deleted: 0, skipped: 0 });

    const allServers = await fetchAllServers();
    setServers(allServers);
    setStats(prev => ({ ...prev, total: allServers.length }));

    const nodeIds = credentials.nodeIds.split(',').map(id => id.trim());

    for (let i = 0; i < allServers.length; i++) {
      const server = allServers[i];
      const serverName = server.attributes.name;
      const nodeId = server.attributes.node;

      if (nodeIds.includes(nodeId.toString()) && !serverName.includes(credentials.excludedNameKeyword)) {
        const deleted = await deleteServer(server.attributes.id);
        if (deleted) {
          setStats(prev => ({ ...prev, deleted: prev.deleted + 1 }));
        }
      } else {
        setStats(prev => ({ ...prev, skipped: prev.skipped + 1 }));
      }

      setProgress((i + 1) / allServers.length * 100);
    }

    setIsProcessing(false);
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Pterodactyl Server Purge</CardTitle>
          <CardDescription>Enter your credentials and settings to start the purge process.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="panelUrl">Panel URL</Label>
              <Input id="panelUrl" name="panelUrl" value={credentials.panelUrl} onChange={handleInputChange} placeholder="https://your-panel-url.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input id="apiKey" name="apiKey" type="password" value={credentials.apiKey} onChange={handleInputChange} placeholder="Your API Key" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nodeIds">Node IDs (comma-separated)</Label>
              <Input id="nodeIds" name="nodeIds" value={credentials.nodeIds} onChange={handleInputChange} placeholder="1,2,3" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="excludedNameKeyword">Excluded Name Keyword</Label>
              <Input id="excludedNameKeyword" name="excludedNameKeyword" value={credentials.excludedNameKeyword} onChange={handleInputChange} placeholder="keyword" />
            </div>
          </form>
        </CardContent>
        <CardFooter>
          <Button onClick={purgeServers} disabled={isProcessing} className="w-full">
            {isProcessing ? 'Processing...' : 'Start Purge'}
          </Button>
        </CardFooter>
      </Card>

      {isProcessing && (
        <Card className="mt-4 w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Purge Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={progress} className="w-full" />
            <div className="mt-4 flex justify-between">
              <div className="flex items-center">
                <Server className="mr-2" />
                <span>Total: {stats.total}</span>
              </div>
              <div className="flex items-center">
                <Trash2 className="mr-2" />
                <span>Deleted: {stats.deleted}</span>
              </div>
              <div className="flex items-center">
                <AlertCircle className="mr-2" />
                <span>Skipped: {stats.skipped}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert variant="destructive" className="mt-4 w-full max-w-md mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default PterodactylServerPurge;
