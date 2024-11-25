import React from 'react';
import './App.css';
import {
  Box,
  ChakraProvider,
  Container,
  extendTheme,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from '@chakra-ui/react';
import { TasksList } from './components/TaskList';
import { CreateTask } from './components/CreateTask';
import { ObjectsList } from './components/ObjectsList';

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
  return (
    <ChakraProvider theme={theme}>
      <Box minH='100vh' bg='gray.50'>
        <Container maxW='container.xl' py={8}>
          <Tabs isLazy>
            <TabList>
              <Tab>Tasks</Tab>
              <Tab>Create Task</Tab>
              <Tab>Objects</Tab>
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
            </TabPanels>
          </Tabs>
        </Container>
      </Box>
    </ChakraProvider>
  );
}

export default App;
