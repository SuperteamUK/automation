import React from 'react';
import './App.css';
import {
  Box,
  ChakraProvider,
  Container,
  extendTheme,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Spinner,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  VStack,
  Text,
  Input,
  Button,
  useToast,
} from '@chakra-ui/react';
import { TasksList } from './features/TaskList';
import { CreateTask } from './features/CreateTask';
import { ObjectsList } from './features/ObjectsList';
import { WorkerManagement } from './features/WorkerManagement';
import { isatty } from 'tty';
import { login } from './api/auth';

const theme = extendTheme({
  styles: {
    global: {
      body: {
        bg: 'gray.50',
        color: 'gray.800',
      },
    },
  },
  colors: {
    brand: {
      primary: 'var(--color-primary)',
      secondary: 'var(--color-secondary)',
      tertiary: 'var(--color-tertiary)',
      accent1: 'var(--color-accent-1)',
      accent2: 'var(--color-accent-2)',
    },
  },
});

function App() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  return (
    <ChakraProvider theme={theme}>
      <Box minH='100vh' bg='gray.50'>
        <Container maxW='container.xl' py={8} minHeight={'600px'}>
          {isAuthenticated && (
            <Tabs isLazy>
              <TabList>
                <Tab>Tasks</Tab>
                <Tab>Create Task</Tab>
                <Tab>Objects</Tab>
                <Tab>Worker</Tab>
              </TabList>
              <TabPanels>
                <TabPanel>
                  <TasksList />
                </TabPanel>
                <TabPanel>
                  <CreateTask />
                </TabPanel>
                <TabPanel>
                  <ObjectsList />
                </TabPanel>
                <TabPanel>
                  <WorkerManagement />
                </TabPanel>
              </TabPanels>
            </Tabs>
          )}
          {!isAuthenticated && (
            <LoginDialog setIsAuthenticated={setIsAuthenticated} />
          )}
        </Container>
      </Box>
    </ChakraProvider>
  );
}

const LoginDialog = ({
  setIsAuthenticated,
}: {
  setIsAuthenticated: (isAuthenticated: boolean) => void;
}) => {
  const [secret, setSecret] = React.useState('');
  const [isOpen, setIsOpen] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(false);
  const toast = useToast();
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        // setIsOpen(false);
      }}
    >
      <ModalHeader>Login</ModalHeader>
      <ModalContent>
        <ModalBody>
          <VStack gap={4}>
            <Text>Enter the secret</Text>
            <Input
              type='text'
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              isDisabled={isLoading}
            />
            <Button
              onClick={async () => {
                try {
                  setIsLoading(true);
                  await login(secret);
                  setIsAuthenticated(true);
                  setIsOpen(false);
                  toast({
                    title: 'Success',
                    description: 'Login successful',
                    status: 'success',
                    duration: 9000,
                    isClosable: true,
                  });
                } catch (e) {
                  toast({
                    title: 'Error',
                    description: 'Login failed',
                    status: 'error',
                    duration: 9000,
                    isClosable: true,
                  });
                } finally {
                  setIsLoading(false);
                }
              }}
              isLoading={isLoading}
            >
              Login
            </Button>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default App;
