import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Container,
  Grid,
  Heading,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  Text,
  VStack,
  HStack,
  Badge,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Progress,
  Divider,
} from '@chakra-ui/react';
import { getMetrics, startWorker, stopWorker } from '../api/worker';
import { WorkerMetrics } from '../types';

const REFRESH_INTERVAL = 5000; // 5 seconds

export function WorkerManagement() {
  const [metrics, setMetrics] = useState<WorkerMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const toast = useToast();

  const fetchMetrics = async () => {
    try {
      const data = await getMetrics();
      setMetrics(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const handleStartWorker = async () => {
    setIsStarting(true);
    try {
      await startWorker();
      toast({
        title: 'Worker started successfully',
        status: 'success',
        duration: 3000,
      });
      fetchMetrics();
    } catch (err) {
      toast({
        title: 'Failed to start worker',
        description: err instanceof Error ? err.message : 'Unknown error',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsStarting(false);
    }
  };

  const handleStopWorker = async () => {
    setIsStopping(true);
    try {
      await stopWorker();
      toast({
        title: 'Worker stopped successfully',
        status: 'success',
        duration: 3000,
      });
      fetchMetrics();
    } catch (err) {
      toast({
        title: 'Failed to stop worker',
        description: err instanceof Error ? err.message : 'Unknown error',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsStopping(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      running: 'green',
      stopped: 'red',
      starting: 'yellow',
      stopping: 'orange',
    };
    return colors[status.toLowerCase()] || 'gray';
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString();
  };

  if (loading) {
    return (
      <Container maxW='container.xl' py={8}>
        <Progress size='xs' isIndeterminate />
        <Text mt={4} textAlign='center'>
          Loading worker metrics...
        </Text>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxW='container.xl' py={8}>
        <Alert status='error'>
          <AlertIcon />
          <AlertTitle>Error loading worker metrics</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </Container>
    );
  }

  if (!metrics) return null;

  return (
    <Container maxW='container.xl' py={8}>
      <VStack spacing={8} align='stretch'>
        {/* Header with Status and Controls */}
        <Box bg='white' p={6} rounded='lg' shadow='sm'>
          <HStack justify='space-between' align='center'>
            <VStack align='start' spacing={2}>
              <Heading size='md'>Worker Status</Heading>
              <Badge
                size='lg'
                colorScheme={getStatusColor(metrics.worker_status)}
                px={3}
                py={1}
                rounded='md'
              >
                {metrics.worker_status}
              </Badge>
            </VStack>
            <HStack spacing={4}>
              <Button
                colorScheme='green'
                onClick={handleStartWorker}
                isLoading={isStarting}
                isDisabled={metrics.worker_status === 'running' || isStopping}
              >
                Start Worker
              </Button>
              <Button
                colorScheme='red'
                onClick={handleStopWorker}
                isLoading={isStopping}
                isDisabled={metrics.worker_status === 'stopped' || isStarting}
              >
                Stop Worker
              </Button>
            </HStack>
          </HStack>
        </Box>

        {/* Metrics Overview */}
        <Grid templateColumns='repeat(auto-fit, minmax(240px, 1fr))' gap={6}>
          <StatGroup bg='white' p={6} rounded='lg' shadow='sm'>
            <Stat>
              <StatLabel>Tasks Processed</StatLabel>
              <StatNumber>{metrics.tasks_processed}</StatNumber>
            </Stat>
            <Stat>
              <StatLabel>Tasks Succeeded</StatLabel>
              <StatNumber color='green.500'>
                {metrics.tasks_succeeded}
              </StatNumber>
            </Stat>
            <Stat>
              <StatLabel>Tasks Failed</StatLabel>
              <StatNumber color='red.500'>{metrics.tasks_failed}</StatNumber>
            </Stat>
            <Stat>
              <StatLabel>Current Tasks</StatLabel>
              <StatNumber color='blue.500'>{metrics.current_tasks}</StatNumber>
            </Stat>
          </StatGroup>
        </Grid>

        {/* Detailed Information */}
        <Box bg='white' p={6} rounded='lg' shadow='sm'>
          <VStack align='stretch' spacing={4}>
            <Heading size='sm'>Detailed Information</Heading>
            <Divider />
            <Grid templateColumns='1fr 1fr' gap={4}>
              <Box>
                <Text fontWeight='bold'>Last Start Time</Text>
                <Text>{formatDateTime(metrics.last_start_time)}</Text>
              </Box>
              <Box>
                <Text fontWeight='bold'>Last Error Time</Text>
                <Text>{formatDateTime(metrics.last_error_time)}</Text>
              </Box>
            </Grid>
            {metrics.last_error && (
              <Box>
                <Text fontWeight='bold' mb={2}>
                  Last Error
                </Text>
                <Alert status='error' variant='left-accent'>
                  <AlertIcon />
                  {metrics.last_error}
                </Alert>
              </Box>
            )}
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
}
