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
  InputGroup,
  InputRightAddon,
} from '@chakra-ui/react';
import { TasksList } from './features/TaskList';
import { CreateTask } from './features/CreateTask';
import { ObjectsList } from './features/ObjectsList';
import { WorkerManagement } from './features/WorkerManagement';
import { login } from './api/auth';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { SecretProvider } from './context/SecretContext';

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
  const [jwt, setJwt] = React.useState('');
  const [secretKey, setSecretKey] = React.useState('');

  return (
    <ChakraProvider theme={theme}>
      <Box minH='100vh' bg='gray.50'>
        <Container maxW='container.xl' py={8} minHeight={'600px'}>
          {isAuthenticated && (
            <SecretProvider value={{ jwt, secretKey, setJwt, setSecretKey }}>
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
            </SecretProvider>
          )}
          {!isAuthenticated && (
            <LoginDialog
              setIsAuthenticated={setIsAuthenticated}
              setJwt={setJwt}
              setSecretKey={setSecretKey}
            />
          )}
        </Container>
      </Box>
    </ChakraProvider>
  );
}

const LoginDialog = ({
  setIsAuthenticated,
  setJwt,
  setSecretKey,
}: {
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  setJwt: (jwt: string) => void;
  setSecretKey: (secretKey: string) => void;
}) => {
  const [secret, setSecret] = React.useState('');
  const [isOpen, setIsOpen] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(false);
  const toast = useToast();
  const [revealPassword, setRevealPassword] = React.useState(false);

  const submit = async () => {
    try {
      setIsLoading(true);
      const { muninn_jwt, control_secret } = await login(secret);
      setJwt(muninn_jwt);
      setSecretKey(control_secret);
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
  };
  return (
    <Modal isOpen={isOpen} onClose={() => {}}>
      <ModalHeader>Login</ModalHeader>
      <ModalContent>
        <ModalBody>
          <VStack gap={4}>
            <Text>Enter the secret</Text>
            <InputGroup>
              <Input
                type={revealPassword ? 'text' : 'password'}
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                isDisabled={isLoading}
                onKeyDownCapture={(e) => {
                  e.key === 'Enter' && submit();
                }}
              />
              <InputRightAddon
                onClick={() => setRevealPassword(!revealPassword)}
                cursor={'pointer'}
              >
                {revealPassword ? <FaEyeSlash /> : <FaEye />}
              </InputRightAddon>
            </InputGroup>

            <Button onClick={submit} isLoading={isLoading}>
              Login
            </Button>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default App;
