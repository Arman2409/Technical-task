import React, { useCallback } from "react";
import { useState, useEffect, useRef, useMemo, useLayoutEffect } from "react";
import ReactDOMServer from "react-dom/server";
import { Avatar, Button, Table, Input, Typography, Row } from "antd";
import type { ColumnsType } from 'antd/es/table';
import axios, { AxiosResponse } from "axios";
import { useUpdateEffect, useIsomorphicLayoutEffect } from "usehooks-ts"
import $ from "jquery";

import UserInfo from "./UserInfo/UserInfo";
import "../../styles/UsersTable.scss";

const { Search } = Input;

interface Column {
    title: string,
    key: string,
    dataIndex: string
};


const UserTable = () => {
    // States 
    const [users, setUsers] = useState<any[]>([]);
    const [user, setUser] = useState<any>();
    const [currentShow, setCurrentShow] = useState<number | null>(null);
    const [info, setInfo] = useState<string>("");
    const [page, setPage] = useState<number | undefined>(1);
    const [trString, setTrString] = useState<string>("");

    // Refs 
    const openedIndexes = useRef<number[]>([]);
    const userRef = useRef<any>({});
    const currentRef = useRef<number>(0);
    const loadingIndexes = useRef<number[]>([]);

    useMemo(() => {
        // Creating string of the info element 
        if(!user || !Object.keys(user).length) {
            return;
        }
        const str = ReactDOMServer.renderToString(<UserInfo user={user} />);
        setTrString(str);
    }, [user]);


    const columns: ColumnsType<Column> = [
        {
            title: "Avatar",
            key: "avatar",
            dataIndex: "avatar",
            render: (source) => (
                <Avatar shape="square" src={source}></Avatar>
            )
        },
        {
            title: "Username",
            key: "username",
            dataIndex: "username"
        },
        {
            title: "Type",
            key: "type",
            dataIndex: "type"
        },
        {
            title: "Options",
            key: "options",
            dataIndex: "index",
            render: (index) => (
                <Button onClick={() => showMore(index) as any}>
                    Show More
                </Button>
            )
        },
    ];


    function searchChange(e: any) {
        if (info) setInfo("");
        if (!e.target.value) {
            getUsers();
        };
    };

    function getMapedUsers(arr: any[]) {
        return arr.map((e: any, i: number) => ({
            ...e,
            index: i,
            key: e.id,
            username: e.login,
            avatar: e.avatar_url
        }))
    }

    function getUsers() {
        axios.get("https://api.github.com/users").then(e => {
            const usersData: any[] = getMapedUsers(e.data);
            setUsers(usersData);
        }).catch(e => {
            console.error(e);
        });
    };

    async function search(e: any) {
        axios.get("https://api.github.com/search/users?q=" + e.split(" ").join("") + "in:user").then(e => {
            const data = getMapedUsers(e.data.items);
            setUsers(data);
        }).catch(e => {
            console.error(e);
            setInfo("Not Found")
        });
    };


    function showMore(e: any) {
        if (currentShow == e || openedIndexes.current.includes(e)) {
            if (e == 0) {
                setCurrentShow(null);
                return;
            }
            setCurrentShow(-e);
            return;
        }
        setCurrentShow(e);
    };

    useIsomorphicLayoutEffect(() => {
        getUsers();
    }, []);

    useUpdateEffect(() => {
        $(`[id*=info]`).each((i, e) => {
            e.remove();
        });
        $('.loading-tr').each((i, e) => {
            e.remove();
        });
    }, [users, page])

    useUpdateEffect(() => {
        // Closing the info table 
        if (currentShow as any < 0 || currentShow == null) {
            let opposite;
            currentShow == null ? opposite = 0 : opposite = -parseInt(currentShow as any);
            $(`#info-${opposite + 1}`).remove();
            $(`#loading-${opposite}`).each((i, el) => el.remove());
            setUser({});
            setTrString("");
            if (openedIndexes.current.includes(opposite)) {
                openedIndexes.current.splice(openedIndexes.current.indexOf(opposite), 1);
                loadingIndexes.current.splice(loadingIndexes.current.indexOf(currentShow as any), 1);
            };
            return;
        };

        // Exiting if already loading 
        if (loadingIndexes.current.includes(currentShow)) {
            return;
        }

        openedIndexes.current.push(currentShow as number | any);
        loadingIndexes.current.push(currentShow as number | any);
        const currentTr: any = $(`.users-table-row`)[currentShow - (20 * (page as number - 1))];
        let newUser:any = users[currentShow as any];
        currentRef.current = newUser;

        // Adding loading 
        const loadingTr: JQuery<HTMLElement> = $("<tr class='loading-tr'></tr>");
        loadingTr
            .css({ display: "flex", alignItems: "center", justifyContent: "center", height: "100px" })
            .append("<p>Loading...</p>")
            .attr("id", `loading-${currentShow}`)
            .insertAfter(currentTr);

        // Getting the repos 
        (async function () {
            currentRef.current = currentShow;
            const repos:AxiosResponse = await axios.get(newUser.repos_url);
            newUser.repos = repos.data.length;
            userRef.current = newUser;

            // Setting the user with repos for useMemo 
            setUser(newUser);
        })()
    }, [currentShow]);

    useUpdateEffect(() => {
        // Inserting info element 
        if (trString) {
            const numberCurrent = parseInt(currentShow as any);
            let node: any = $.parseHTML(trString)[0];
            node.setAttribute("style", "position: absolute; left: 25px; top: 0; height: 100px; width: 100%");
            const newTr: JQuery<HTMLElement> = $("<tr></tr>")
            if ($(`#info-${numberCurrent + 1}`).length) {
                return;
            };
            const currentTr: any = $(`.users-table-row`)[numberCurrent - (20 * (page as number - 1))];
            $(`#loading-${currentShow}`).remove();
            newTr.attr("id", `info-${numberCurrent + 1}`)
                .css({ position: "relative", height: "100px" })
                .append(node)
                .insertAfter(currentTr);
            loadingIndexes.current.splice(loadingIndexes.current.indexOf(currentShow as any), 1);
        }
    }, [trString])

    return (
        <>
            <Row align={"middle"}>
                <Search className="search-input" onChange={(e) => searchChange(e)} onSearch={(e) => search(e)} />
                <Typography style={{ color: "red", marginRight: "10px" }}>{info}</Typography>
            </Row>
            <Table rowClassName={"users-table-row"} className="users-table" columns={columns} dataSource={users} pagination={{ pageSize: 20 }} onChange={(e) => setPage(e.current)} />
        </>
    )
};

export default UserTable;