import React, { useState, useEffect } from "react";
import axios, { AxiosResponse } from "axios";
import {
    Box,
    Container,
    Typography,
    Grid,
} from "@mui/material";
import { styled } from "@mui/system";
import VerifyIcon from "@mui/icons-material/Verified";
import JSZip from "jszip";
import { DataGrid } from '@mui/x-data-grid';
import FileViewer from '../FileViewer';

const HeaderTypography = styled(Typography)(({ theme }) => ({
    borderBottom: `4px solid`,
    display: "inline-block",
}));

function Neutron() {
    const [unzippedFiles, setUnzippedFiles] = useState<any>([]);
    const [activeTab, setActiveTab] = useState(0);

    const [data, setData] = useState([]);
    const [selectedData, setSelectedData] = useState(null);
    const [verificationResult, setVerificationResult] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            const result = await axios(
                'https://api.welldonestudio.io/compiler/neutron-deploy-histories?chainId=testnet&offset=0&fetchSize=50',
            );

            setData(result.data.reverse());
        };
        fetchData();
    }, []);

    const handleRowClick = async (param: any) => {
        setSelectedData(param.row);
        try {
            const response = await axios.post(
                'https://prod.neutron.compiler.welldonestudio.io/verification/neutron',
                { contractAddress: param.row.contractAddress, chainId: 'testnet' }
            );
            if (response.data.isVerified) {
                let resFile = await fetch(response.data.srcUrl)
                console.log(resFile)
                if (!resFile.ok) {
                    throw new Error('Network response was not ok');
                }

                const arrayBuffer = await resFile.arrayBuffer();
                const blob = new Blob([arrayBuffer], { type: "application/zip" });

                console.log(blob);

                const zip = new JSZip();
                const unzipped = await zip.loadAsync(blob);

                const codes = await processFiles(unzipped);

                console.log(codes)
                setUnzippedFiles(codes);
            }
            setVerificationResult(response.data);
            console.log(response.data)
        } catch (err) {
            console.error(err);
        }
    };

    const processFiles = async (unzipped: any) => {
        const filePromises: any = [];

        unzipped.forEach((relativePath: any, file: any) => {
            if (!file.dir) {
                const filePromise = file.async("text").then((content: any) => {
                    return { name: file.name, content: content };
                });
                filePromises.push(filePromise);
            }
        });

        const codes = await Promise.all(filePromises);
        return codes;
    };

    const DataTable = ({
        data,
        setData,
        selectedData,
        setSelectedData,
        verificationResult,
        setVerificationResult,
        handleRowClick
    }: {
        data: any,
        setData: React.Dispatch<React.SetStateAction<any>>,
        selectedData: any,
        setSelectedData: React.Dispatch<React.SetStateAction<any>>,
        verificationResult: any,
        setVerificationResult: React.Dispatch<React.SetStateAction<any>>,
        handleRowClick: (param: any) => Promise<void>
    }) => {
        const columns = [
            { field: 'contractAddress', headerName: 'Contract Address', width: '450', headerAlign: 'center', align: 'center' },
            { field: 'envOsName', headerName: 'OS', width: '150', headerAlign: 'center', align: 'center' },
            { field: 'envOsVersion', headerName: 'OS Version', width: '150', headerAlign: 'center', align: 'center' },
            { field: 'envRustcVersion', headerName: 'Rust Version', width: '150', headerAlign: 'center', align: 'center' },
            { field: 'envCargoWasmVersion', headerName: 'Cargo Version', width: '150', headerAlign: 'center', align: 'center' },
        ];

        return (
            <div style={{ width: '100%' }}>
                <DataGrid rows={data} columns={columns as any} onRowClick={handleRowClick} />
                {verificationResult && (
                    <div>
                        {verificationResult.isVerified ? (
                            <div>
                                <h2>Verification Successful</h2>
                                <p>{verificationResult.srcUrl}</p>
                            </div>
                        ) : (
                            <div>
                                <h2>Verification Failed</h2>
                                <p>{verificationResult.errMsg}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }

    return (
        <Container maxWidth="lg">
            <Box sx={{ my: 4 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item>
                        <VerifyIcon fontSize="large" />
                    </Grid>
                    <Grid item>
                        <Box component="h1">
                            <HeaderTypography variant="h4">Neutron Smart Contract Verification API</HeaderTypography>
                        </Box>
                    </Grid>
                </Grid>

                <Box mb={3}>
                    <Typography variant="h6" gutterBottom>
                        About
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                        Neutron Smart Contract Verification API is a platform for verifying CosmWasm smart contracts deployed on Remix IDE. <br />Our principle is simple: <strong>'Don't trust, verify'.</strong></Typography>
                </Box>
                <Box mb={3}>
                    <DataTable
                        data={data}
                        setData={setData}
                        selectedData={selectedData}
                        setSelectedData={setSelectedData}
                        verificationResult={verificationResult}
                        setVerificationResult={setVerificationResult}
                        handleRowClick={handleRowClick}
                    />
                </Box>
                <Box mb={3}>
                    <div>
                        <div>
                            {unzippedFiles.map((file: any, index: any) => (
                                <button
                                    type="button"
                                    key={index}
                                    onClick={(event) => {
                                        event.preventDefault();
                                        setActiveTab(index);
                                    }}
                                >
                                    {file.name}
                                </button>
                            ))}
                        </div>

                        <div>
                            <h3>{unzippedFiles[activeTab]?.name}</h3>
                            <FileViewer code={unzippedFiles[activeTab]?.content} />
                        </div>
                    </div>

                </Box>
            </Box>
        </Container>
    );
}


export default Neutron;

